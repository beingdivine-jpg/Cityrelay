import { beforeEach, describe, expect, it } from "vitest";
import { setLanguage } from "./i18n";
import { examples, seedProfiles } from "./data";
import { assessCase, assessMatches } from "./matching";
import { exportPlan, createPlan } from "./planLogic";
import { loadState, saveState, seedState, STORAGE_KEY } from "./storage";
import { getSource } from "./sources";
beforeEach(() => setLanguage("en"));
const profile = () => structuredClone(seedProfiles[0]);
const find = (id: string, p = profile()) =>
  assessMatches(p, examples).find((a) => a.example.id === id)!;
describe("Documented projects and honest local readiness", () => {
  it("starts with researched Kraków and no invented local resources or outcomes", () => {
    const p = profile();
    expect(p.name).toBe("Kraków");
    expect(Object.values(p.assets).every((v) => v === "unknown")).toBe(true);
    expect(p.resources).toEqual({ budget: "unknown", staff: "unknown" });
    expect(seedState().outcomes).toEqual([]);
    expect(seedState().events).toEqual([]);
    expect(
      assessMatches(p, examples).every(
        (a) => a.category === "Needs confirmation",
      ),
    ).toBe(true);
  });
  it("every project fact resolves to dated primary evidence, without invented delivery estimates", () => {
    expect(new Set(examples.map((e) => e.origin.name)).size).toBe(5);
    for (const ex of examples) {
      expect(ex.sources).toContain(ex.fact.sourceId);
      for (const id of ex.sources) {
        const s = getSource(id)!;
        expect(s.url).toMatch(/^https:\/\//);
        expect(s.checked).toBeTruthy();
        expect(s.publisher).toBeTruthy();
      }
      expect(ex.resourceNeeds).toEqual({ budget: "unknown", staff: "unknown" });
      expect(ex.timingDays).toBeNull();
      expect(ex.evidenceType).toBe("Documented project");
    }
  });
  it("cannot turn an unknown transfer cost or duration into a confirmed fit by choosing generous local resources", () => {
    const p = profile();
    p.resources = { budget: "capital", staff: "dedicated" };
    p.goals.horizon = "1095";
    p.assets.building = "yes";
    const a = find("barcelona-shelters", p);
    expect(a.category).toBe("Needs confirmation");
    expect(
      a.readiness
        .filter((r) => ["budget", "staff", "timing"].includes(r.key))
        .every((r) => r.state === "unknown"),
    ).toBe(true);
    expect(a.readiness.find((r) => r.key === "building")?.state).toBe("met");
  });
  it("keeps unavailable and unknown assets distinct", () => {
    const p = profile();
    expect(find("barcelona-shelters", p).question).toContain(
      "confirm accessible public building",
    );
    p.assets.building = "no";
    expect(find("barcelona-shelters", p).category).toBe(
      "Does not fit current constraints",
    );
    p.assets.building = "unknown";
    p.resources.staff = "none";
    expect(
      find("barcelona-shelters", p).readiness.find((r) => r.key === "staff")
        ?.state,
    ).toBe("unmet");
    p.resources.staff = "unknown";
    p.resources.budget = "none";
    expect(
      find("barcelona-shelters", p).readiness.find((r) => r.key === "budget")
        ?.state,
    ).toBe("unmet");
  });
  it("explains the library connection and recomputes it when local initiatives change", () => {
    const p = profile();
    const before = find("barcelona-shelters", p).rank;
    expect(assessMatches(p, examples)[0].example.id).toBe("barcelona-shelters");
    p.existingInitiatives = [];
    expect(find("barcelona-shelters", p).rank).toBe(before - 15);
  });
  it("filters heat, water and the desired outcome without manufacturing projects for unsupported topics", () => {
    const p = profile();
    expect(assessMatches(p, examples)).toHaveLength(3);
    p.goals.outcome = "reach";
    expect(assessMatches(p, examples).map((a) => a.example.id)).toEqual([
      "barcelona-shelters",
    ]);
    p.problems = ["water"];
    p.goals.outcome = "all";
    expect(assessMatches(p, examples).map((a) => a.example.id)).toEqual([
      "singapore-bishan",
    ]);
    p.problems = ["services"];
    expect(assessMatches(p, examples).map((a) => a.example.id)).toEqual([
      "helsinki-info",
    ]);
    p.problems = ["unknown"];
    expect(assessMatches(p, examples)).toHaveLength(0);
  });
  it("ranks a known unmet asset behind unknown requirements despite a strong initiative connection", () => {
    const p = profile();
    p.assets.building = "no";
    expect(assessMatches(p, examples).at(-1)?.example.id).toBe(
      "barcelona-shelters",
    );
  });
});
describe("Local persistence and source-linked export", () => {
  it("does not attribute Kraków initiatives to a user-created place", () => {
    const p = profile();
    p.id = "local-place";
    p.name = "Local test profile";
    p.existingInitiatives = [];
    const plan = createPlan(p, examples[0]);
    expect(plan.proposal).not.toContain("Kraków");
    expect(plan.adaptations).toContain(
      "No local site, programme or allocation is assumed",
    );
  });
  it("uses a separate storage key and preserves earlier prototype data", () => {
    const data = new Map<string, string>([["cityrelay.demo.v1", "old data"]]);
    const state = seedState();
    state.profiles[0].assets.building = "no";
    expect(
      saveState(state, {
        setItem: (key, value) => {
          data.set(key, value);
        },
      }),
    ).toBe("");
    expect(STORAGE_KEY).not.toBe("cityrelay.demo.v1");
    expect(data.get("cityrelay.demo.v1")).toBe("old data");
    expect(
      loadState({ getItem: (key) => data.get(key) ?? null }).state.profiles[0]
        .assets.building,
    ).toBe("no");
    expect(seedState().profiles[0].assets.building).toBe("unknown");
  });
  it("restores an advisor workspace while accepting saved data from before advisor entry existed", () => {
    const state = seedState();
    expect(loadState({ getItem: () => JSON.stringify(state) }).error).toBe("");
    state.advisor = {
      name: "Test advisor",
      role: "Municipal innovation advisor",
      activeCommunityId: "krakow",
      entryMode: "guided",
    };
    expect(
      loadState({ getItem: () => JSON.stringify(state) }).state.advisor,
    ).toEqual(state.advisor);
    state.advisor.activeCommunityId = "missing-profile";
    expect(loadState({ getItem: () => JSON.stringify(state) }).error).toContain(
      "could not be read",
    );
  });
  it("offers project-specific proposals for another place without importing Kraków's context", () => {
    const p = profile();
    p.id = "test-place";
    p.name = "Test municipality";
    p.existingInitiatives = [];
    const plans = examples.map((e) => createPlan(p, e));
    expect(new Set(plans.map((p) => p.proposal)).size).toBe(examples.length);
    expect(plans.every((p) => !p.proposal.includes("Kraków"))).toBe(true);
    expect(
      plans.find((p) => p.selectedExamples.includes("helsinki-info"))?.proposal,
    ).toContain("advice session");
  });
  it("surfaces corrupt records and failed saves without claiming success", () => {
    expect(loadState({ getItem: () => "{invalid" }).error).toContain(
      "could not be read",
    );
    const state = seedState();
    state.profiles = [];
    expect(loadState({ getItem: () => JSON.stringify(state) }).error).toContain(
      "could not be read",
    );
    expect(
      loadState({
        getItem: () =>
          JSON.stringify({ ...seedState(), plans: [{ id: "broken" }] }),
      }).error,
    ).toContain("could not be read");
    expect(
      saveState(seedState(), {
        setItem: () => {
          throw Error("storage denied");
        },
      }),
    ).toContain("could not save");
  });
  it("rejects simulation records instead of presenting old fictional events as real", () => {
    const state = {
      ...seedState(),
      events: [
        {
          id: "old",
          communityId: "krakow",
          kind: "heat-warning",
          source: "Demo",
          timestamp: "2026-10-03",
          validUntil: "2026-10-04",
          changedFields: ["timing"],
          simulation: true,
        },
      ],
    };
    expect(loadState({ getItem: () => JSON.stringify(state) }).error).toContain(
      "could not be read",
    );
  });
  it("exports sources, unresolved checks and a dated weather snapshot separately from the proposal", () => {
    const state = seedState(),
      p = state.profiles[0];
    const snapshot =
      "Test fixture: provider timestamp 2026-10-03 14:00; fetched 2026-10-03T14:10:00Z";
    const plan = createPlan(p, examples[0], snapshot);
    state.plans.push(plan);
    const result = exportPlan(p, plan, state);
    expect(result).toContain("UNKNOWN: Accessible public building");
    expect(result).toContain("not an approved municipal project");
    expect(result).toContain(getSource("barcelona-shelters")!.url);
    expect(result).toContain("June 2025");
    expect(result).toContain(snapshot);
    expect(result).toContain("No observations recorded.");
    expect(result).not.toContain("Synthetic scenario");
  });
  it("labels submitted local observations as unverified and leaves project claims unchanged", () => {
    const state = seedState(),
      p = state.profiles[0],
      plan = createPlan(p, examples[0]);
    state.plans.push(plan);
    state.outcomes.push({
      id: "test-observation",
      planId: plan.id,
      date: "2026-10-03",
      action: "Test fixture action",
      observations: "Test fixture observation",
      effort: "Not measured",
      obstacles: "Not entered",
      lessons: "Not entered",
      provenance: "User-reported observation — unverified",
    });
    const result = exportPlan(p, plan, state);
    expect(result).toContain("User-reported observation — unverified");
    expect(result).toContain("Test fixture observation");
    expect(examples[0].evidenceType).toBe("Documented project");
  });
});

it("can inspect a resident-led case without silently changing the municipal brief", () => {
  const p = profile();
  const original = structuredClone(p);
  const helsinki = examples.find((e) => e.id === "helsinki-info")!;
  expect(p.problems).toEqual(["heat"]);
  expect(assessCase(p, helsinki).example.id).toBe("helsinki-info");
  expect(assessCase(p, helsinki).category).toBe("Needs confirmation");
  expect(p).toEqual(original);
  p.goals.objective = "A heat adaptation objective";
  expect(createPlan(p, helsinki).goal).not.toContain("heat adaptation");
});
