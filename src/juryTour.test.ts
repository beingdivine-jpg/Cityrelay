import { expect, it } from "vitest";
import { advanceJuryStep, type JuryStep } from "./juryTourModel";
import { startDemo, DEMO_ID } from "./demo";
import { withDemoReality } from "./demoReality";
import { seedState, validState } from "./storage";
import { assessCase } from "./matching";
import { examples } from "./data";
import { createPlan, exportPlan } from "./planLogic";
import { translateText } from "./i18n";
import { juryCopy } from "./juryCopy";
it("waits for actual completion and export, and recovers from a stopped run", () => {
  expect(advanceJuryStep("run", "downloaded")).toBe("run");
  expect(advanceJuryStep("run", "stopped")).toBe("launch");
  expect(advanceJuryStep("launch", "completed")).toBe("launch");
  let step: JuryStep = "listen";
  for (const action of [
    "voice",
    "data",
    "agents",
    "started",
    "completed",
    "findings",
    "case",
    "fit",
    "adapt",
    "pilot",
    "downloaded",
  ] as const)
    step = advanceJuryStep(step, action);
  expect(step).toBe("done");
});
it("fills every demo check without asserting real feasibility or touching real work", () => {
  const state = startDemo(seedState());
  const profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  for (const example of examples) {
    const checks = assessCase(profile, example).readiness;
    expect(checks.every((c) => c.state === "unknown")).toBe(true);
    expect(checks.every((c) => c.explanation.includes("Demo"))).toBe(true);
    expect(profile.localChecks![example.id].budget.evidence).toContain(
      "PLN 25,000",
    );
  }
  expect(validState(state)).toBe(true);
  expect(withDemoReality(profile)).toBe(profile);
  expect(withDemoReality(state.profiles[0])).toBe(state.profiles[0]);
  const exportText = exportPlan(
    profile,
    createPlan(profile, examples[0]),
    state,
  );
  expect(exportText).toContain("PLN 25,000");
  expect(exportText).toContain("hypothetical");
});
it("upgrades an older demo without replacing user-written findings or other data", () => {
  const state = startDemo(seedState());
  const profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  const authored = {
    state: "unmet" as const,
    owner: "Local reviewer",
    evidence: "The chosen site is unavailable for this proposed pilot.",
    at: "2026-10-01",
  };
  profile.localChecks = { [examples[0].id]: { budget: authored } };
  profile.note = "Keep my draft";
  const next = withDemoReality(profile);
  expect(next.localChecks![examples[0].id].budget).toBe(authored);
  expect(next.note).toBe("Keep my draft");
  expect(state.civic![DEMO_ID].authority.confirmed).toBe(false);
  expect(
    assessCase(next, examples[0]).readiness.find((c) => c.key === "budget")!
      .state,
  ).toBe("unmet");
});
it("never promotes a sample finding to confirmed even if its state is edited", () => {
  const state = startDemo(seedState()),
    profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  profile.localChecks![examples[0].id].budget.state = "met";
  expect(
    assessCase(profile, examples[0]).readiness.find((c) => c.key === "budget")!
      .state,
  ).toBe("unknown");
});
it("provides Polish guidance and sample evidence throughout the journey", () => {
  for (const step of Object.values(juryCopy)) {
    for (const text of [step.title, step.body, step.action])
      expect(translateText(text, "pl")).not.toBe(text);
  }
  const state = startDemo(seedState()),
    profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  for (const group of Object.values(profile.localChecks!))
    for (const check of Object.values(group))
      expect(translateText(check.evidence, "pl")).not.toBe(check.evidence);
});
