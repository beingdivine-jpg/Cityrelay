import { t, locale } from "./i18n";
import { examples } from "./data";
import { fitScoreLimits, fitScoreMethod, type FitScore } from "./fitScore";
import "./fitScore.css";

export default function FitScorecard({
  score,
  expanded = false,
}: {
  score: FitScore;
  expanded?: boolean;
}) {
  const project = examples.find((example) => example.id === score.exampleId);
  if (!project) return null;
  return (
    <section
      className="fit-scorecard"
      aria-label={`${t("Fit scorecard")} · ${project.origin.name}`}
    >
      <div className="fit-score-head">
        <div>
          <span className="eyebrow">{t("RESEARCH FIT")}</span>
          <h3>
            {project.origin.name} · {t(project.shortTitle)}
          </h3>
          <p>
            {t(
              score.blocked
                ? "Blocked by local constraints"
                : score.unknown
                  ? "Local evidence needed"
                  : "Recorded checks align",
            )}
          </p>
        </div>
        <div className="fit-score-number">
          <strong>{score.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <meter
        min="0"
        max="100"
        value={score.score}
        aria-label={t("Research fit score")}
      />
      <p className="fit-score-gates">
        <span>
          {t("Met")}: <b>{score.met}</b>
        </span>
        <span>
          {t("Unknown")}: <b>{score.unknown}</b>
        </span>
        <span>
          {t("Blocked")}: <b>{score.blocked}</b>
        </span>
      </p>
      <details open={expanded}>
        <summary>{t("How this score is calculated")}</summary>
        <div className="fit-score-matrix">
          {score.factors.map((factor) => (
            <div className="fit-score-factor" key={factor.label}>
              <div>
                <strong>{t(factor.label)}</strong>
                <span>
                  {factor.value} / {factor.maximum} {t("points")}
                </span>
              </div>
              <p>{t(factor.explanation)}</p>
            </div>
          ))}
        </div>
        <p className="fit-score-formula">
          {score.points} ÷ {score.maximum} × 100 →{" "}
          <strong>{score.score}/100</strong>
        </p>
        <p>{t(fitScoreMethod)}</p>
        <p>{t(fitScoreLimits)}</p>
        <small>
          {t("Scoring method")}: fit-v1 ·{" "}
          {new Date(score.calculatedAt).toLocaleString(locale())}
        </small>
      </details>
    </section>
  );
}
