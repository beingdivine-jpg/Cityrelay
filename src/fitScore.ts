import type { MatchAssessment } from "./model";

export type FitScore = {
  version: "fit-v1";
  exampleId: string;
  calculatedAt: string;
  score: number;
  points: number;
  maximum: number;
  factors: {
    label: string;
    value: number;
    maximum: number;
    explanation: string;
  }[];
  met: number;
  unknown: number;
  blocked: number;
};

export const fitScoreMethod =
  "Research fit, not a probability of success. Challenge relevance: 40 points; same community setting: 5; connected initiatives: 15 each, up to 30; requirements: +4 per met check and −3 per unknown check. The score is earned points divided by the possible total, rounded and bounded to 0–100. Unmet requirements block readiness regardless of score.";
export const fitScoreLimits =
  "Population, project costs and predicted outcomes do not add points. This is an explicit planning rubric, not a validated prediction. Demo assumptions remain unknown.";

export function calculateFitScore(
  assessment: MatchAssessment,
  at = new Date().toISOString(),
): FitScore {
  const maxima = [40, 5, 30, assessment.readiness.length * 4];
  const factors = assessment.factors.map((factor, index) => ({
    ...factor,
    maximum: maxima[index],
  }));
  const points = factors.reduce((sum, factor) => sum + factor.value, 0);
  const maximum = maxima.reduce((sum, value) => sum + value, 0);
  return {
    version: "fit-v1",
    exampleId: assessment.example.id,
    calculatedAt: at,
    score: Math.max(0, Math.min(100, Math.round((points / maximum) * 100))),
    points,
    maximum,
    factors,
    met: assessment.readiness.filter((check) => check.state === "met").length,
    unknown: assessment.readiness.filter((check) => check.state === "unknown")
      .length,
    blocked: assessment.readiness.filter((check) => check.state === "unmet")
      .length,
  };
}

export function validFitScore(value: unknown): value is FitScore {
  if (!value || typeof value !== "object") return false;
  const score = value as FitScore;
  if (
    score.version !== "fit-v1" ||
    typeof score.exampleId !== "string" ||
    typeof score.calculatedAt !== "string" ||
    !Number.isFinite(Date.parse(score.calculatedAt)) ||
    !Array.isArray(score.factors) ||
    score.factors.length !== 4
  )
    return false;
  if (
    ![score.met, score.unknown, score.blocked].every(
      (n) => Number.isSafeInteger(n) && n >= 0,
    )
  )
    return false;
  const maxima = [40, 5, 30, (score.met + score.unknown + score.blocked) * 4];
  if (
    !score.factors.every(
      (factor, i) =>
        factor &&
        typeof factor.label === "string" &&
        typeof factor.explanation === "string" &&
        Number.isFinite(factor.value) &&
        factor.maximum === maxima[i] &&
        factor.value <= factor.maximum &&
        factor.value >= -factor.maximum,
    )
  )
    return false;
  const points = score.factors.reduce((sum, factor) => sum + factor.value, 0),
    maximum = maxima.reduce((sum, n) => sum + n, 0);
  return (
    score.points === points &&
    score.maximum === maximum &&
    score.score ===
      Math.max(0, Math.min(100, Math.round((points / maximum) * 100)))
  );
}
