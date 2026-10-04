import { afterEach, expect, it } from "vitest";
import {
  calculateFitScore,
  fitScoreMethod,
  fitScoreLimits,
  validFitScore,
} from "./fitScore";
import { assessCase } from "./matching";
import { examples } from "./data";
import { startDemo, DEMO_ID } from "./demo";
import { seedState, validState } from "./storage";
import { localAnalysis } from "./civicEngine";
import { createPlan, exportPlan } from "./planLogic";
import { setLanguage, translateText } from "./i18n";

afterEach(() => setLanguage("en"));
const fixture = () => {
  const state = startDemo(seedState());
  return {
    state,
    profile: state.profiles.find((p) => p.id === DEMO_ID)!,
    civic: state.civic![DEMO_ID],
    example: examples.find((e) => e.id === "barcelona-shelters")!,
  };
};

it("shows the exact existing weighting and keeps hypothetical evidence unknown", () => {
  const { profile, civic, example } = fixture();
  const score = calculateFitScore(assessCase(profile, example, civic));
  expect(score.factors.map((f) => f.value)).toEqual([40, 5, 15, -18]);
  expect(score.points).toBe(42);
  expect(score.maximum).toBe(99);
  expect(score.score).toBe(42);
  expect(score.unknown).toBe(6);
  expect(score.met).toBe(0);
  expect(validFitScore(score)).toBe(true);
  expect(validFitScore({ ...score, score: 99 })).toBe(false);
});

it("withheld inputs and unrelated cases do not earn relevance or context points", () => {
  const { profile, civic, example } = fixture();
  civic.connections = civic.connections.map((c) => ({
    ...c,
    enabled: c.key === "catalogue",
  }));
  const score = calculateFitScore(assessCase(profile, example, civic));
  expect(score.factors.map((f) => f.value)).toEqual([0, 0, 0, -18]);
  expect(score.score).toBe(0);
  expect(score.unknown).toBe(6);
});

it("keeps a blocking requirement visible even when other evidence earns points", () => {
  const { profile, civic, example } = fixture();
  const assessment = assessCase(profile, example, civic);
  profile.localChecks = {
    [example.id]: Object.fromEntries(
      assessment.readiness.map((check) => [
        check.key,
        {
          state: check.key === "building" ? "unmet" : "met",
          evidence:
            "Recorded local inspection and responsible operator review.",
          owner: "Test advisor",
          at: "2026-10-04T00:00:00Z",
        },
      ]),
    ),
  };
  const score = calculateFitScore(assessCase(profile, example, civic));
  expect(score.blocked).toBe(1);
  expect(score.met).toBe(5);
  expect(score.score).toBeGreaterThan(70);
  expect(assessCase(profile, example, civic).category).toBe(
    "Does not fit current constraints",
  );
});

it("records immutable scorecards during the reviewer stage and includes the full matrix in both report languages", async () => {
  const { state, profile, civic, example } = fixture();
  const run = await localAnalysis(profile, civic, () => {});
  civic.runs = [run];
  const cards = run.events!.filter((e) => e.scorecard);
  expect(cards.length).toBe(run.opportunities.length);
  expect(
    cards.every((e) => e.agent === "reviewer" && validFitScore(e.scorecard)),
  ).toBe(true);
  expect(cards[0].scorecard).toEqual(
    run.opportunities.find(
      (o) => o.exampleId === cards[0].scorecard!.exampleId,
    )!.scorecard,
  );
  expect(validState(state)).toBe(true);
  const plan = createPlan(profile, example);
  const english = exportPlan(profile, plan, state);
  expect(english).toContain("Fit scorecards & scoring matrix");
  expect(english).toContain("42/100");
  expect(english).toContain("42 / 99 × 100");
  expect(english).toContain(fitScoreLimits);
  setLanguage("pl");
  const polish = exportPlan(profile, plan, state);
  expect(polish).toContain("Karty dopasowania i macierz punktacji");
  expect(polish).toContain("42/100");
  expect(polish).toContain("Priorytet i kierunek");
  expect(polish).not.toContain(fitScoreMethod);
  for (const text of [
    fitScoreMethod,
    fitScoreLimits,
    "How this score is calculated",
    "Fit score calculated",
  ])
    expect(translateText(text, "pl")).not.toBe(text);
  profile.existingInitiatives = [];
  expect(cards[0].scorecard!.score).toBe(42);
  const corrupted = structuredClone(state);
  corrupted.civic![DEMO_ID].runs[0].opportunities[0].scorecard!.score = 1000;
  expect(validState(corrupted)).toBe(false);
});
