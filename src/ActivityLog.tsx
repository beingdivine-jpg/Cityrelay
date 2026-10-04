import { useEffect, useRef, useState } from "react";
import type { AgentEvent, AgentKey, AgentStep } from "./civicModel";
import { agentDefinitions } from "./civicEngine";
import { t, locale } from "./i18n";
import ResearchTrace from "./ResearchTrace";
import AgentScan from "./AgentScan";
export default function ActivityLog({
  events,
  busy,
  waiting,
  mode,
  selected,
  step,
  readable,
  onPaceChange,
}: {
  events: AgentEvent[];
  busy: boolean;
  waiting: boolean;
  mode: "local" | "ai";
  selected: AgentKey;
  step?: AgentStep;
  readable: boolean;
  onPaceChange: (value: boolean) => void;
}) {
  const [follow, setFollow] = useState(true),
    [filter, setFilter] = useState("all"),
    [scope, setScope] = useState<"agent" | "run">("agent"),
    [now, setNow] = useState(Date.now());
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => setFilter("all"), [selected]);
  useEffect(() => {
    if (!busy || waiting) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [busy, waiting, selected]);
  useEffect(() => {
    if (follow && panel.current)
      panel.current.scrollTop = panel.current.scrollHeight;
  }, [events.length, follow, filter, selected, scope]);
  const agent = agentDefinitions.find((a) => a.id === selected)!;
  const agentEvents = events.filter((e) => e.agent === selected);
  const latest = agentEvents.at(-1);
  const working = busy && !waiting && step?.status === "running";
  const seconds = step
    ? Math.max(
        0,
        Math.floor(
          ((step.completedAt
            ? Date.parse(step.completedAt)
            : busy
              ? now
              : Date.parse(latest?.at || step.startedAt)) -
            Date.parse(step.startedAt)) /
            1000,
        ),
      )
    : 0;
  const visible = events.filter(
    (e) =>
      (scope === "run" || e.agent === selected) &&
      (filter === "all" || e.kind === filter || (filter === "source" && e.url)),
  );
  // These rows come only from actual request start/completion callbacks.
  const requests = [
    ...new Map(
      agentEvents
        .filter(
          (e) =>
            e.url &&
            [
              "Checking a live source page",
              "Source page retrieved",
              "Source page unavailable",
            ].includes(e.title),
        )
        .map((e) => [e.url!, e]),
    ).values(),
  ];
  const pending = requests.filter(
    (e) => e.title === "Checking a live source page",
  );
  const unavailable = requests.filter(
    (e) => e.title === "Source page unavailable",
  ).length;
  return (
    <div className={`activity-console ${working ? "activity-running" : ""}`}>
      <section className="research-stage" key={selected}>
        <div className="activity-focus">
          <div className="activity-focus-meta">
            <span>
              {t(agent.name)} ·{" "}
              {t(
                working
                  ? "Working now"
                  : step?.status === "complete"
                    ? "Output ready"
                    : step?.status === "failed"
                      ? "Stopped"
                      : latest
                        ? "Recorded activity"
                        : "Not started",
              )}
            </span>
            <span
              className="activity-elapsed"
              aria-label={t("Stage elapsed time")}
            >
              {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
            </span>
          </div>
          <h2 className="stage-verb">{t(agent.verb)}</h2>
          <AgentScan agent={selected} events={agentEvents} working={working} />
          <span className="stage-action-label">
            {t(
              working
                ? "CURRENT ACTION"
                : latest
                  ? "LAST RECORDED ACTION"
                  : "THE ASSIGNMENT",
            )}
          </span>
          <strong>
            {t(
              working && pending.length
                ? "Waiting for source responses"
                : latest?.title || agent.verb,
            )}
          </strong>
          <p>
            {latest
              ? mode === "local"
                ? t(latest.detail)
                : latest.detail
              : t(agent.description)}
          </p>
          {latest?.url && (
            <a href={latest.url} target="_blank" rel="noreferrer">
              {new URL(latest.url).hostname} ↗
            </a>
          )}
          {working && (
            <div className="activity-motion" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          )}
        </div>
        <details className="trace-disclosure">
          <summary>{t("Inspect the action trace")}</summary>
          <ResearchTrace events={agentEvents} working={working} />
        </details>
        {requests.length > 0 && (
          <details className="source-requests" open>
            <summary>
              {t("Live page requests")} · {requests.length - pending.length}/
              {requests.length}
              {unavailable > 0 && (
                <>
                  {" "}
                  · {t("Unavailable")}: {unavailable}
                </>
              )}
            </summary>
            {requests.map((request) => (
              <div key={request.url}>
                <a href={request.url} target="_blank" rel="noreferrer">
                  {new URL(request.url!).hostname} ↗
                </a>
                <span>
                  {t(
                    request.title === "Checking a live source page"
                      ? busy && !waiting
                        ? "Awaiting response"
                        : "No response recorded"
                      : request.title === "Source page retrieved"
                        ? "Retrieved"
                        : "Unavailable",
                  )}
                </span>
              </div>
            ))}
          </details>
        )}
      </section>
      <section className="research-ledger">
        <header>
          <div>
            <i className={busy && !waiting ? "working-light" : "console-dot"} />
            <strong>{t("Activity log")}</strong>
            <span>
              {t(
                waiting
                  ? "Waiting for you"
                  : busy
                    ? "In progress"
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
        <p className="visible-pace-note">
          {t(
            mode === "local"
              ? readable
                ? "Local analysis · actions paced for reading · source requests use real response times."
                : "Local analysis · full speed · source requests use real response times."
              : "AI service activity · source and search events appear when received.",
          )}
        </p>
        <details className="log-controls">
          <summary>{t("View & playback")}</summary>
          {mode === "local" && (
            <div className="activity-pace">
              <div role="group" aria-label={t("Activity reading speed")}>
                <button
                  aria-pressed={readable}
                  onClick={() => onPaceChange(true)}
                >
                  {t("Reading pace")}
                </button>
                <button
                  aria-pressed={!readable}
                  onClick={() => onPaceChange(false)}
                >
                  {t("Full speed")}
                </button>
              </div>
              <p>
                {t(
                  readable
                    ? "Local actions are spaced for reading. Live requests use their actual response time."
                    : "Local analysis · full speed · source requests use real response times.",
                )}
              </p>
            </div>
          )}
          <div
            className="log-scope"
            role="group"
            aria-label={t("Activity scope")}
          >
            <button
              aria-pressed={scope === "agent"}
              onClick={() => setScope("agent")}
            >
              {t("This agent")} · {agentEvents.length}
            </button>
            <button
              aria-pressed={scope === "run"}
              onClick={() => setScope("run")}
            >
              {t("Whole investigation")} · {events.length}
            </button>
          </div>
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
              {visible.length} {t("events")}
            </span>
          </div>
        </details>
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
                      agentDefinitions.find((a) => a.id === event.agent)
                        ?.name || event.agent,
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
                    ? "No actions in this view yet"
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
      </section>
    </div>
  );
}
