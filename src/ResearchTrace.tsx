import type { AgentEvent } from "./civicModel";
import { t } from "./i18n";
const rows = ["input", "query", "source", "check", "output"];
const labels = ["Inputs", "Searches", "Sources", "Checks", "Outputs"];
export default function ResearchTrace({
  events,
  working,
}: {
  events: AgentEvent[];
  working: boolean;
}) {
  const shown = events.slice(-64);
  return (
    <figure className={`research-trace ${working ? "is-working" : ""}`}>
      <div className="trace-diagram">
        <div className="trace-axis" aria-hidden="true">
          {labels.map((label) => (
            <span key={label}>{t(label)}</span>
          ))}
        </div>
        <svg
          viewBox="0 0 300 130"
          preserveAspectRatio="none"
          role="img"
          aria-label={t("Each mark represents a recorded action.")}
        >
          {rows.map((kind, i) => (
            <path
              key={kind}
              d={`M0 ${16 + i * 23}H300`}
              className="trace-rule"
            />
          ))}
          {shown.map((event, i) => {
            const row =
              event.kind === "handoff"
                ? 4
                : event.kind === "error"
                  ? 3
                  : Math.max(0, rows.indexOf(event.kind));
            const x = 5 + i * (290 / 63),
              y = 16 + row * 23;
            return (
              <g
                key={event.id}
                className={`trace-mark trace-${event.kind} ${i === shown.length - 1 ? "trace-latest" : ""}`}
              >
                <title>{t(event.title)}</title>
                <path d={`M${x} ${y - 5}v10`} />
                {i === shown.length - 1 && <circle cx={x} cy={y} r="7" />}
              </g>
            );
          })}
        </svg>
      </div>
      <figcaption>
        <span>{t("ACTIVITY TRACE")}</span>
        <span>{t("Each mark is a recorded action.")}</span>
      </figcaption>
    </figure>
  );
}
