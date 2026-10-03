import { afterEach, expect, it } from "vitest";
import { examples, seedProfiles, newProfile } from "./data";
import {
  addPlanExample,
  checkpointPlan,
  createPlan,
  exportPlan,
} from "./planLogic";
import {
  buildOpportunities,
  compareFactors,
  duplicateReport,
  newCivic,
  runFingerprint,
  summarizeReports,
  triageIdeas,
} from "./civicEngine";
import { assessCase } from "./matching";
import { setLanguage, translateText } from "./i18n";
import { seedState, validState } from "./storage";
import { workspaceDocument } from "./shared";
import type { CivicReport } from "./civicModel";
const report = (overrides: Partial<CivicReport> = {}): CivicReport => ({
  id: "r",
  kind: "idea",
  title: "Library shade",
  detail: "An accessible waiting space near the library.",
  area: "Centre",
  topic: "heat",
  submittedAt: "2026-10-03",
  status: "received",
  externalConsent: false,
  ...overrides,
});
afterEach(() => setLanguage("en"));
it("adding a second project preserves all authored pilot fields", () => {
  const p = createPlan(seedProfiles[0], examples[0]);
  p.proposal = "My original proposal";
  p.goal = "My original goal";
  const result = addPlanExample(p, examples[1].id);
  expect(result.proposal).toBe(p.proposal);
  expect(result.goal).toBe(p.goal);
  expect(result.adaptations).toBe(p.adaptations);
  expect(addPlanExample(result, examples[1].id).selectedExamples).toHaveLength(
    2,
  );
  expect(checkpointPlan(result).revisions?.[0].proposal).toBe(p.proposal);
});
it("retains priorities when residents raise a topic outside the library", () => {
  const p = structuredClone(seedProfiles[0]),
    c = newCivic(p);
  const signals = summarizeReports([
    report({ kind: "complaint", topic: "waste" }),
  ]);
  expect(buildOpportunities(p, c, signals).map((o) => o.topic)).toContain(
    "heat",
  );
  expect(signals[0].topic).toBe("waste");
});
it("routes relevant ideas to review without claiming that open checks are satisfied", () => {
  const p = structuredClone(seedProfiles[0]),
    c = newCivic(p);
  const opportunities = buildOpportunities(p, c, []);
  expect(opportunities.every((o) => o.state === "investigate")).toBe(true);
  expect(triageIdeas([report()], opportunities)[0].state).toBe("review");
  p.assets.building = "no";
  expect(
    buildOpportunities(p, c, []).find((o) => o.exampleId === examples[0].id)
      ?.state,
  ).toBe("hold");
});
it("uses one implementation checklist and lets recorded evidence resolve it", () => {
  const p = structuredClone(seedProfiles[0]),
    c = newCivic(p),
    ex = examples[0];
  const checks = assessCase(p, ex).readiness;
  expect(
    compareFactors(p, c, ex)
      .filter((f) => f.checkKey)
      .map((f) => f.checkKey),
  ).toEqual(checks.map((c) => c.key));
  p.localChecks = {
    [ex.id]: Object.fromEntries(
      checks.map((check) => [
        check.key,
        {
          state: "met" as const,
          owner: "Audit team",
          evidence: "Document 42, site visit and operator confirmation.",
          at: "2026-10-03",
        },
      ]),
    ),
  };
  expect(assessCase(p, ex).readiness.every((c) => c.state === "met")).toBe(
    true,
  );
  expect(
    buildOpportunities(p, c, []).find((o) => o.exampleId === ex.id)?.state,
  ).toBe("ready");
  c.connections.find((c) => c.key === "resources")!.enabled = false;
  expect(
    buildOpportunities(p, c, []).find((o) => o.exampleId === ex.id)?.state,
  ).toBe("investigate");
});
it("recognises English and Polish initiative names consistently", () => {
  for (const name of ["Public library", "Biblioteka publiczna"]) {
    const p = structuredClone(seedProfiles[0]);
    p.existingInitiatives = [name];
    expect(
      compareFactors(p, newCivic(p), examples[0]).find(
        (f) => f.name === "Existing local initiatives",
      )?.state,
    ).toBe("aligned");
    expect(assessCase(p, examples[0]).reasons[0]).toContain(name);
  }
});
it("does not collapse different areas or report types into duplicates", () => {
  expect(
    duplicateReport(
      [report()],
      "Library shade",
      "An accessible waiting space near the library.",
      "North",
      "idea",
      "heat",
    ),
  ).toBeUndefined();
  expect(
    duplicateReport(
      [report()],
      "Library shade",
      "An accessible waiting space near the library.",
      "Centre",
      "complaint",
      "heat",
    ),
  ).toBeUndefined();
});
it("generates Polish pilot suggestions for every project and a custom city", () => {
  setLanguage("pl");
  const p = newProfile();
  p.name = "Lublin";
  p.problems = ["heat"];
  for (const ex of examples) {
    const plan = createPlan(p, ex);
    expect(plan.proposal).not.toMatch(
      /Proposed next step|Explore |Ask |Bring |Consult /,
    );
    expect(plan.adaptations).not.toMatch(
      /public land|public building|water access/,
    );
    expect(exportPlan(p, plan, seedState())).not.toContain(
      "Budget: Not yet known",
    );
  }
  expect(translateText("Staff: Not yet known", "pl")).toBe(
    "Personel: Jeszcze nie wiadomo",
  );
});
it("does not retain raw resident text in run fingerprints", () => {
  const p = structuredClone(seedProfiles[0]),
    c = newCivic(p);
  c.reports = [report()];
  const before = runFingerprint(p, c);
  expect(before.length).toBeLessThan(80);
  expect(before).not.toContain("Library");
  c.reports[0].detail += " New information.";
  expect(runFingerprint(p, c)).not.toBe(before);
});
it("creates an isolated shared document without uploading practice reports", () => {
  const state = seedState();
  state.civic = { krakow: newCivic(state.profiles[0]) };
  state.civic.krakow.reports = [report()];
  state.plans = [createPlan(state.profiles[0], examples[0])];
  const target = crypto.randomUUID();
  const copied = workspaceDocument(state, "krakow", target);
  expect(validState(copied)).toBe(true);
  expect(copied.civic?.[target].reports).toEqual([]);
  expect(copied.plans[0].communityId).toBe(target);
  expect(state.civic.krakow.reports).toHaveLength(1);
});

it("rejects a backup checkpoint that changes the pilot identity", () => {
  const state = seedState();
  state.plans = [checkpointPlan(createPlan(state.profiles[0], examples[0]))];
  expect(validState(state)).toBe(true);
  state.plans[0].revisions![0].snapshot!.communityId = "another-city";
  expect(validState(state)).toBe(false);
});
it("remaps pilot checkpoints when explicitly creating a shared copy", () => {
  const state = seedState();
  state.plans = [checkpointPlan(createPlan(state.profiles[0], examples[0]))];
  const copy = workspaceDocument(state, state.profiles[0].id, "new-workspace");
  expect(validState(copy)).toBe(true);
  expect(copy.plans[0].revisions![0].snapshot!.communityId).toBe(
    "new-workspace",
  );
});
