import { agentDefinitions } from "./civicEngine";
import type { AgentEvent, AgentKey } from "./civicModel";
import { t } from "./i18n";

/** Motion indicates a running stage; packets and record labels follow real events. */
export default function AgentScan({
  agent,
  events,
  working,
}: {
  agent: AgentKey;
  events: AgentEvent[];
  working: boolean;
}) {
  const index = agentDefinitions.findIndex((item) => item.id === agent);
  const latest = events.at(-1);
  const lanes = ["input", "query", "source", "check"];
  const lane = Math.max(0, lanes.indexOf(latest?.kind || "input"));
  const records = events
    .filter((e) => e.kind !== "output" && e.kind !== "handoff")
    .slice(-3);
  return (
    <div className={`agent-scan ${working ? "is-scanning" : ""}`}>
      <svg className="scan-node-field" viewBox="0 0 440 170" aria-hidden="true">
        <defs>
          <pattern
            id="scan-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r=".7" fill="currentColor" opacity=".2" />
          </pattern>
        </defs>
        <rect width="440" height="170" fill="url(#scan-grid)" />
        {[30, 67, 104, 141].map((y, i) => (
          <g
            key={y}
            className={lane === i && working ? "scan-lane active" : "scan-lane"}
          >
            <path d={`M18 ${y} H90 Q118 ${y} 138 85 H185`} />
            <circle cx="18" cy={y} r="4" />
          </g>
        ))}
        <path className="scan-outlet" d="M255 85 H420" />
        <circle className="scan-orbit" cx="220" cy="85" r="67" />
        <circle className="scan-orbit orbit-inner" cx="220" cy="85" r="53" />
        <circle className="scan-core" cx="220" cy="85" r="35" />
        <text x="220" y="94" textAnchor="middle">
          {String(index + 1).padStart(2, "0")}
        </text>
        <circle cx="420" cy="85" r="5" className="scan-endpoint" />
        {latest && working && (
          <circle key={latest.id} className="scan-packet" r="4">
            <animateMotion
              dur="1s"
              repeatCount="1"
              path={`M18 ${[30, 67, 104, 141][lane]} H90 Q118 ${[30, 67, 104, 141][lane]} 138 85 H420`}
            />
          </circle>
        )}
      </svg>
      <div className="scan-caption">
        <span>
          {t(
            working
              ? "AGENT RUNNING"
              : events.length
                ? "RECORDED WORK"
                : "AGENT READY",
          )}
        </span>
        <span>
          {t("Recorded actions")}: {events.length}
        </span>
      </div>
      <div className="scan-records" aria-label={t("Scan activity")}>
        {records.length ? (
          records.map((event) => (
            <div key={event.id} className="scan-record">
              <span className={`scan-record-mark mark-${event.kind}`} />
              <span>
                <strong>{t(event.title)}</strong>
                <small>
                  {t(event.url ? new URL(event.url).hostname : event.detail)}
                </small>
              </span>
            </div>
          ))
        ) : (
          <p>
            {t(
              "Permitted inputs enter here. The active node lights up as each action is recorded.",
            )}
          </p>
        )}
      </div>
    </div>
  );
}
