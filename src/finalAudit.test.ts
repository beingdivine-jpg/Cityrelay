import { expect, it } from "vitest";
import { startDemo, DEMO_ID } from "./demo";
import { localAnalysis } from "./civicEngine";
import { seedState, validState } from "./storage";
import { createPlan } from "./planLogic";
import { examples } from "./data";
import { translateText } from "./i18n";
import { partialRunMessage } from "./researchRecord";

it("rejects malformed backup identities and optional fields before replacing saved work", () => {
  const state = startDemo(seedState());
  expect(validState({ ...state, profiles: [...state.profiles, null] })).toBe(
    false,
  );
  expect(
    validState({ ...state, profiles: [...state.profiles, state.profiles[0]] }),
  ).toBe(false);
  const invalidSources = structuredClone(state);
  (invalidSources.profiles[0] as unknown as { sources: unknown }).sources =
    "not an array";
  expect(validState(invalidSources)).toBe(false);
  const badPlan = createPlan(state.profiles[0], examples[0]);
  badPlan.selectedExamples = ["missing-project"];
  expect(validState({ ...state, plans: [badPlan] })).toBe(false);
});

it("rejects imported research that would crash the comparison or create unsafe source links", async () => {
  const state = startDemo(seedState());
  const profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  const civic = state.civic![DEMO_ID];
  civic.runs = [await localAnalysis(profile, civic, () => {})];
  expect(validState(state)).toBe(true);
  for (const mutate of [
    (copy: typeof state) => {
      copy.civic![DEMO_ID].runs[0].opportunities[0].exampleId =
        "missing-project";
    },
    (copy: typeof state) => {
      copy.civic![DEMO_ID].runs[0].steps[0].citations = [
        { title: "Unsafe", url: "javascript:alert(1)" },
      ];
    },
    (copy: typeof state) => {
      copy.civic![DEMO_ID].runs[0].reportCount = -1;
    },
    (copy: typeof state) => {
      copy.civic![DEMO_ID].runs[0].events![0].url =
        "https://name:secret@example.org/";
    },
  ]) {
    const copy = structuredClone(state);
    mutate(copy);
    expect(validState(copy)).toBe(false);
  }
  expect(validState(state)).toBe(true);
});

it("provides Polish recovery instructions for unfinished and empty research", () => {
  for (const text of [
    partialRunMessage,
    "Project library access is switched off.",
    "The agents respected your data settings. Review library access, then run the research again to compare documented projects.",
    "Your challenge is saved. Our current library has no matching project. Refine the priority or keep this evidence gap for further research.",
    "No current leads to compare.",
    "Check the shared inputs and your challenge, then run the agents again. The guide will continue when there are documented results.",
    "Review your inputs, then restart the research.",
    "Review inputs & try again",
  ])
    expect(translateText(text, "pl")).not.toBe(text);
});
