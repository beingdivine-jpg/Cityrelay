import { useEffect, useRef, useState } from "react";
import type { AgentEvent } from "./civicModel";
import { agentDefinitions } from "./civicEngine";
import { t, locale } from "./i18n";
export default function ActivityLog({
  events,
  busy,
  waiting,
  mode,
}: {
  events: AgentEvent[];
  busy: boolean;
  waiting: boolean;
  mode: "local" | "ai";
}) {
  const [follow, setFollow] = useState(true),
    [filter, setFilter] = useState("all");
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (follow && panel.current)
      panel.current.scrollTop = panel.current.scrollHeight;
  }, [events.length, follow, filter]);
  const visible = events.filter(
    (e) =>
      filter === "all" || e.kind === filter || (filter === "source" && e.url),
  );
  return (
    <div className="activity-console">
      <header>
        <div>
          <i className={busy && !waiting ? "working-light" : "console-dot"} />
          <strong>{t("Activity log")}</strong>
          <span>
            {t(
              waiting
                ? "Waiting for you"
                : busy
                  ? "Live"
                  : events.length
                    ? "Recorded"
                    : "Ready",
            )}
          </span>
        </div>
        <label>
          <input
            type="checkbox"
            checked={follow}
            onChange={(e) => setFollow(e.target.checked)}
          />
          {t("Follow latest")}
        </label>
      </header>
      <div className="log-filters">
        {[
          ["all", "All actions"],
          ["query", "Searches"],
          ["source", "Sources"],
          ["check", "Checks"],
        ].map(([key, label]) => (
          <button
            key={key}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {t(label)}
          </button>
        ))}
        <span>
          {events.length} {t("events")}
        </span>
      </div>
      <div
        className="activity-entries"
        ref={panel}
        role="log"
        aria-label={t("Agent activity log")}
        aria-live="polite"
        aria-relevant="additions"
        tabIndex={0}
      >
        {visible.length ? (
          visible.map((event) => (
            <article key={event.id} className={`log-event log-${event.kind}`}>
              <span className="log-time">
                {new Date(event.at).toLocaleTimeString(locale(), {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <div>
                <span className="log-agent">
                  {t(
                    agentDefinitions.find((a) => a.id === event.agent)?.name ||
                      event.agent,
                  )}
                </span>
                <strong>{t(event.title)}</strong>
                {event.detail.length > 350 ? (
                  <details>
                    <summary>{t("Inspect recorded output")}</summary>
                    <p>{mode === "local" ? t(event.detail) : event.detail}</p>
                  </details>
                ) : (
                  <p>{mode === "local" ? t(event.detail) : event.detail}</p>
                )}
                {event.url && (
                  <a href={event.url} target="_blank" rel="noreferrer">
                    {new URL(event.url).hostname} ↗
                  </a>
                )}
              </div>
              <span className="log-sequence">
                {String(events.indexOf(event) + 1).padStart(2, "0")}
              </span>
            </article>
          ))
        ) : (
          <div className="console-empty">
            <span aria-hidden="true">↗</span>
            <h3>
              {t(
                events.length
                  ? "No actions in this filter yet"
                  : "An investigation you can follow.",
              )}
            </h3>
            <p>
              {t(
                "Inputs opened. Reports grouped. Sources checked. Unknowns flagged. Each action earns its place in this record.",
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
