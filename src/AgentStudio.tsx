import { reportJuryEvent } from "./juryTourModel";
import { useShared } from "./SharedContext";
import { sharedClient } from "./shared";
import { t as tr, locale, getLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "./navigation";
import { Button, CommunityNav, Icon } from "./components";
import { checkSourcesLive, useAgentService, useCivic } from "./CivicContext";
import {
  agentDefinitions,
  allowed,
  buildOpportunities,
  localAnalysis,
  runFingerprint,
  summarizeReports,
  triageIdeas,
  topicLabels,
} from "./civicEngine";
import { Missing } from "./Workspace";
import { DEMO_ID } from "./demo";
import ActivityLog from "./ActivityLog";
import { waitForActivity } from "./activityPace";
import type {
  AgentEvent,
  AgentCitation,
  AgentKey,
  AgentRun,
  AgentStep,
} from "./civicModel";
export function CitedOutput({
  text,
  local = false,
  citations,
}: {
  text: string;
  local?: boolean;
  citations: AgentCitation[];
}) {
  const inline = citations
    .filter(
      (c) =>
        typeof c.start === "number" &&
        typeof c.end === "number" &&
        c.start >= 0 &&
        c.end > c.start &&
        c.end <= text.length,
    )
    .sort((a, b) => a.start! - b.start!);
  let cursor = 0;
  const parts: (string | React.ReactElement)[] = [];
  for (const c of inline) {
    if (c.start! < cursor) continue;
    parts.push(text.slice(cursor, c.start));
    parts.push(
      <a
        key={`${c.url}-${c.start}`}
        href={c.url}
        target="_blank"
        rel="noreferrer"
      >
        {text.slice(c.start, c.end) || c.title}
        {tr(" ↗")}
      </a>,
    );
    cursor = c.end!;
  }
  parts.push(text.slice(cursor));
  return (
    <>
      <div className="agent-output-text">{local ? tr(parts) : parts}</div>
      {tr(
        citations.length > 0 && (
          <div className="agent-citations">
            {tr(
              [...new Map(citations.map((c) => [c.url, c])).values()].map(
                (c) => (
                  <a key={c.url} href={c.url} target="_blank" rel="noreferrer">
                    <Icon name="book" size={14} />
                    {c.title} <span>{tr("↗")}</span>
                  </a>
                ),
              ),
            )}
          </div>
        ),
      )}
    </>
  );
}
export default function AgentStudio() {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
  const service = useAgentService(),
    shared = useShared();
  const canAI = service.ai && (!service.requiresAccount || !!shared.workspace);
  const [mode, setMode] = useState<"local" | "ai">("local"),
    [selected, setSelected] = useState<AgentKey>("listener");
  const [liveSteps, setLiveSteps] = useState<AgentStep[]>([]),
    [liveEvents, setLiveEvents] = useState<AgentEvent[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false);
  const [guided, setGuided] = useState(true),
    [sourceChecks, setSourceChecks] = useState(true),
    [waiting, setWaiting] = useState<AgentKey | null>(null),
    [viewId, setViewId] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null),
    gate = useRef<(() => void) | null>(null);
  const [readable, setReadable] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const readingPace = useRef(true),
    followAgent = useRef(true);
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    const list = rail.current;
    const active = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({
      left:
        list.scrollLeft +
        active.getBoundingClientRect().left -
        list.getBoundingClientRect().left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [selected]);
  useEffect(() => () => abort.current?.abort(), []);
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);
  if (!profile || !civic) return <Missing />;
  const last =
    (viewId && civic.runs.find((r) => r.id === viewId)) || civic.runs[0];
  const steps = busy ? liveSteps : last?.steps || [],
    events = busy ? liveEvents : last?.events || [];
  const selectedStep = steps.find((s) => s.id === selected),
    completed = steps.filter((s) => s.status === "complete").length;
  const displayMode = busy ? mode : last?.mode || mode;
  const activeAgent = steps.find((s) => s.status === "running")?.id;
  async function run() {
    if (!profile || !civic || busy) return;
    setBusy(true);
    if (id === DEMO_ID) reportJuryEvent({ action: "started" });
    setError("");
    setWaiting(null);
    setViewId(null);
    setLiveSteps([]);
    setLiveEvents([]);
    setSelected("listener");
    followAgent.current = true;
    requestAnimationFrame(() =>
      document.getElementById("agent-workbench")?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
    const controller = new AbortController();
    abort.current = controller;
    const snapshot = structuredClone(civic),
      place = structuredClone(profile),
      startedAt = new Date().toISOString();
    let completedSteps: AgentStep[] = [],
      recorded: AgentEvent[] = [],
      currentAgent: AgentKey = "listener",
      runningStep: AgentStep | undefined;
    const log = (event: AgentEvent) => {
      recorded = [...recorded, event];
      setLiveEvents(recorded);
    };
    const emit = (
      agent: AgentKey,
      kind: AgentEvent["kind"],
      title: string,
      detail: string,
      url?: string,
    ) =>
      log({
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        agent,
        kind,
        title,
        detail,
        url,
      });
    const onStep = (step: AgentStep) => {
      currentAgent = step.id;
      if (id === DEMO_ID && step.status === "running")
        reportJuryEvent({
          agent:
            agentDefinitions.find((a) => a.id === step.id)?.name || step.id,
          waiting: false,
        });
      runningStep = step.status === "running" ? step : undefined;
      setLiveSteps((list) => [...list.filter((s) => s.id !== step.id), step]);
      if (followAgent.current) {
        setSelected(step.id);
        if (step.status === "running")
          requestAnimationFrame(() =>
            document.getElementById("agent-workbench")?.scrollIntoView({
              block: "start",
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            }),
          );
      }
      if (step.status === "complete")
        completedSteps = [
          ...completedSteps.filter((s) => s.id !== step.id),
          step,
        ];
    };
    try {
      let result: AgentRun;
      if (mode === "local")
        result = await localAnalysis(place, snapshot, onStep, {
          signal: controller.signal,
          onEvent: log,
          afterEvent: (event) =>
            waitForActivity(
              controller.signal,
              readingPace.current
                ? event.kind === "output" || event.kind === "handoff"
                  ? 1200
                  : event.kind === "check"
                    ? 650
                    : 1000
                : 0,
            ),
          beforeStep: async (agent) => {
            if (!guided || agent === "listener") return;
            setWaiting(agent);
            if (id === DEMO_ID)
              reportJuryEvent({
                agent:
                  agentDefinitions.find((a) => a.id === agent)?.name || agent,
                waiting: true,
              });
            await new Promise<void>((resolve, reject) => {
              const cancel = () => {
                gate.current = null;
                reject(Error("Run cancelled."));
              };
              gate.current = () => {
                controller.signal.removeEventListener("abort", cancel);
                gate.current = null;
                setWaiting(null);
                resolve();
              };
              controller.signal.addEventListener("abort", cancel, {
                once: true,
              });
              if (controller.signal.aborted) cancel();
            });
          },
          checkSources: sourceChecks
            ? async (logSource) => {
                await checkSourcesLive(
                  snapshot,
                  (event) => {
                    const source = event.source || event.snapshot!;
                    logSource({
                      kind:
                        event.phase === "complete" &&
                        event.snapshot?.status !== "ok"
                          ? "error"
                          : "source",
                      title:
                        event.phase === "started"
                          ? "Checking a live source page"
                          : event.snapshot?.status === "ok"
                            ? "Source page retrieved"
                            : "Source page unavailable",
                      detail:
                        event.phase === "started"
                          ? source.title
                          : event.snapshot?.status === "ok"
                            ? "Page content retrieved. This does not independently verify every source claim."
                            : event.snapshot?.error ||
                              "No current page check is claimed.",
                      url: source.url,
                    });
                  },
                  controller.signal,
                );
              }
            : undefined,
        });
      else {
        emit(
          "listener",
          "input",
          "Submitting permitted research inputs",
          "Only enabled data groups and separately consented reports and documents are sent.",
        );
        const token = sharedClient
          ? (await sharedClient.auth.getSession()).data.session?.access_token
          : undefined;
        const response = await fetch("/api/research", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            profile: place,
            workspaceId: shared.workspace?.id,
            language: getLanguage(),
            authority: `${snapshot.authority.name} / ${snapshot.authority.kind}`,
            focus: allowed(snapshot, "context")
              ? place.problems.map((p) => topicLabels[p]).join(", ")
              : "Municipal focus withheld; use only permitted reports",
            shared: snapshot.connections
              .filter((c) => c.enabled)
              .map((c) => c.key),
            reports: allowed(snapshot, "reports")
              ? snapshot.reports.filter((r) => r.externalConsent)
              : [],
            documents: allowed(snapshot, "context")
              ? snapshot.documents.filter((d) => d.enabled && d.externalConsent)
              : [],
            consent,
          }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const msg = await response
            .json()
            .catch(() => ({ error: "Research service unavailable." }));
          throw Error(msg.error);
        }
        if (!response.body) throw Error("No research stream received.");
        const reader = response.body.getReader(),
          decoder = new TextDecoder();
        let buffer = "",
          done = false;
        const consume = (line: string) => {
          if (!line.trim()) return;
          const event = JSON.parse(line);
          if (event.type === "error") throw Error(event.error);
          if (event.type === "step") {
            onStep(event.step);
            emit(
              event.step.id,
              event.step.status === "running" ? "input" : "output",
              event.step.status === "running"
                ? "Agent request started"
                : "Stage output recorded",
              event.step.status === "running"
                ? event.step.input
                : event.step.output,
            );
            for (const search of event.searches || [])
              for (const query of search.queries || [])
                if (typeof query === "string")
                  emit(
                    event.step.id,
                    "query",
                    "Reported web search query",
                    query,
                  );
            for (const citation of event.step.citations || [])
              emit(
                event.step.id,
                "source",
                "Source cited by the agent",
                citation.title,
                citation.url,
              );
          }
          if (event.type === "done") done = true;
        };
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            buffer += decoder.decode(part.value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            lines.forEach(consume);
          }
          buffer += decoder.decode();
          if (buffer.trim()) consume(buffer);
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
        if (!done) throw Error("Research ended before all agents completed.");
        const reports = allowed(snapshot, "reports") ? snapshot.reports : [],
          signals = summarizeReports(reports),
          opportunities = buildOpportunities(place, snapshot, signals);
        result = {
          id: crypto.randomUUID(),
          startedAt,
          completedAt: new Date().toISOString(),
          mode: "ai",
          status: "complete",
          fingerprint: runFingerprint(place, snapshot),
          steps: completedSteps,
          events: recorded,
          signals,
          opportunities,
          ideas: triageIdeas(reports, opportunities),
          reportCount: reports.filter(
            (r) => !r.duplicateOf && r.status === "received",
          ).length,
        };
      }
      change((c) => ({
        ...c,
        runs: [result, ...c.runs].slice(0, 20),
        notices: [
          {
            id: `run-${result.id}`,
            title:
              mode === "ai"
                ? "AI research is ready for review"
                : "Local analysis is ready for review",
            detail: `${result.reportCount} eligible submissions · ${result.opportunities.length} documented leads. Open the evidence trail before making a decision.`,
            at: result.completedAt,
            read: false,
            kind: "analysis" as const,
          },
          ...c.notices,
        ].slice(0, 100),
      }));
      if (followAgent.current) setSelected("writer");
      if (id === DEMO_ID) reportJuryEvent({ action: "completed" });
    } catch (e) {
      const message = controller.signal.aborted
        ? "Run cancelled."
        : e instanceof Error
          ? e.message
          : "Analysis failed.";
      setError(message);
      if (id === DEMO_ID) reportJuryEvent({ action: "stopped" });
      emit(currentAgent, "error", "Run stopped", message);
      const failed: AgentRun = {
        id: crypto.randomUUID(),
        startedAt,
        completedAt: new Date().toISOString(),
        mode,
        status: "failed",
        fingerprint: runFingerprint(place, snapshot),
        steps: runningStep
          ? [
              ...completedSteps,
              {
                ...runningStep,
                status: "failed",
                completedAt: new Date().toISOString(),
                output: message,
              },
            ]
          : completedSteps,
        events: recorded,
        signals: [],
        opportunities: [],
        ideas: [],
        reportCount: 0,
        error: message,
      };
      change((c) => ({ ...c, runs: [failed, ...c.runs].slice(0, 20) }));
    } finally {
      setTransferring(false);
      setBusy(false);
      setWaiting(null);
      abort.current = null;
      gate.current = null;
    }
  }
  return (
    <div className="page-width civic-page agent-page">
      <CommunityNav profile={profile} />
      <header className="agent-heading">
        <div>
          <span className="eyebrow">{tr("STEP 02 / THE RESEARCH ROOM")}</span>
          <h1>
            {profile.name}
            <span className="research-heading-slash" aria-hidden="true">
              {" "}
              /{" "}
            </span>
            <span className="blue-text">{tr("In perspective.")}</span>
          </h1>
        </div>
        <p>
          {tr(
            id === DEMO_ID
              ? "Start the research, follow each agent’s work, then compare what they found. You control when the next stage begins."
              : "Inspect each action, source and result. You decide what becomes a local pilot.",
          )}
        </p>
      </header>
      <section className="agent-launch">
        <div>
          <span className="eyebrow">{tr("ON THE DESK")}</span>
          <h2>
            {profile.name} · {tr("research inputs")}
          </h2>
          <p>
            {tr(
              `${civic.reports.length} submissions · ${civic.connections.filter((c) => c.enabled).length} shared data groups · ${civic.documents.filter((d) => d.enabled).length} local documents`,
            )}
          </p>
          <Link to={`/community/${id}/data`}>{tr("Review data access")} ↗</Link>
        </div>
        <div className="agent-launch-actions">
          <Button
            data-tour="launch"
            disabled={
              busy ||
              (mode === "ai" &&
                (!canAI || !consent || !allowed(civic, "catalogue")))
            }
            onClick={() => void run()}
          >
            {tr(
              busy
                ? "Investigation in progress"
                : last
                  ? "Start a new investigation"
                  : "Start the research",
            )}{" "}
            <Icon />
          </Button>
          <details className="research-settings">
            <summary>{tr("Research settings")}</summary>{" "}
            <div className="agent-mode-switch">
              <button
                disabled={busy}
                aria-pressed={mode === "local"}
                onClick={() => setMode("local")}
              >
                {tr("Local analysis")}
              </button>
              <button
                disabled={busy || !canAI}
                aria-pressed={mode === "ai"}
                onClick={() => setMode("ai")}
              >
                {tr(canAI ? "Live AI research" : "AI research · not connected")}
              </button>
            </div>
            {mode === "local" ? (
              <div className="agent-run-settings">
                <label>
                  <input
                    type="checkbox"
                    checked={guided}
                    disabled={busy}
                    onChange={(e) => setGuided(e.target.checked)}
                  />
                  {tr("Pause at each handoff")}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={sourceChecks}
                    disabled={busy}
                    onChange={(e) => setSourceChecks(e.target.checked)}
                  />
                  {tr("Check source pages live")}
                </label>
              </div>
            ) : (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={consent}
                  disabled={busy}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                {tr(
                  "Send the shared municipal brief, permitted reports and permitted documents to OpenAI for this run. Usage may incur API costs.",
                )}
              </label>
            )}
          </details>
        </div>
      </section>
      <p className="agent-method-note">
        {tr(
          mode === "local"
            ? "Local analysis is ready. The source checks retrieve real city pages. Open Research settings to inspect the method."
            : "AI requests and reported search queries appear as the service returns them. Search details may arrive with the completed stage.",
        )}
      </p>
      {error && (
        <p role="alert" className="form-error">
          {tr(error)}
        </p>
      )}
      <section
        id="agent-workbench"
        data-tour="workbench"
        className={`agent-workbench ${busy ? "network-active" : ""} ${transferring ? "network-transferring" : ""}`}
        aria-label={tr("Agent work dashboard")}
      >
        <div className="network-heading">
          <span>{tr("AGENT NETWORK")}</span>
          <strong>
            {tr(
              transferring
                ? "Passing findings to the next agent…"
                : waiting
                  ? "Handoff ready · your review"
                  : busy
                    ? "Agents running · follow the work below"
                    : "Five agents. One evidence trail.",
            )}
          </strong>
          <span>
            {completed}/5 {tr("stages completed")}
          </span>
        </div>
        <aside className="agent-rail" ref={rail}>
          <span className="eyebrow">{tr("RESEARCH TEAM")}</span>
          {agentDefinitions.map((agent, i) => {
            const step = steps.find((s) => s.id === agent.id);
            const actionCount = events.filter(
              (e) => e.agent === agent.id,
            ).length;
            return (
              <button
                key={agent.id}
                aria-pressed={selected === agent.id}
                className={`${selected === agent.id ? "selected" : ""} ${step?.status === "running" ? "node-running" : ""} ${step?.status === "complete" ? "node-complete" : ""} ${waiting === agent.id ? "node-next" : ""}`}
                onClick={() => {
                  followAgent.current = false;
                  setSelected(agent.id);
                }}
              >
                <span className="rail-number">
                  {step?.status === "complete"
                    ? "✓"
                    : String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{tr(agent.name)}</strong>
                  <small>
                    {tr(
                      step?.status === "running"
                        ? "Working now"
                        : step?.status === "complete"
                          ? "Output ready"
                          : step?.status === "failed"
                            ? "Stopped"
                            : "Not started",
                    )}
                    {" · "}
                    {actionCount} {tr(actionCount === 1 ? "action" : "actions")}
                  </small>
                </span>
                {step?.status === "running" && <i className="working-light" />}
              </button>
            );
          })}
          <p>
            {completed}/5 {tr("stages completed")}
          </p>
          {busy && activeAgent && selected !== activeAgent && (
            <button
              className="follow-agent"
              onClick={() => {
                followAgent.current = true;
                setSelected(activeAgent);
              }}
            >
              {tr("Follow the working agent")} <Icon />
            </button>
          )}
        </aside>
        <div className="agent-log-panel">
          <ActivityLog
            events={events}
            busy={busy}
            waiting={!!waiting}
            mode={displayMode}
            selected={selected}
            step={selectedStep}
            readable={readable}
            onPaceChange={(value) => {
              readingPace.current = value;
              setReadable(value);
            }}
          />
          <div className="agent-handoff" role="status">
            {transferring && (
              <div className="handoff-transfer" aria-hidden="true">
                <i />
                <span>{tr("Passing the evidence record…")}</span>
              </div>
            )}
            {waiting ? (
              <>
                <div>
                  <strong>{tr("Handoff ready")}</strong>
                  <p>
                    {tr("Inspect the log, then continue when you are ready.")}
                  </p>
                </div>
                <Button
                  data-tour="handoff"
                  disabled={transferring}
                  onClick={async () => {
                    const signal = abort.current?.signal;
                    if (!signal || transferring) return;
                    setTransferring(true);
                    try {
                      await waitForActivity(
                        signal,
                        window.matchMedia("(prefers-reduced-motion: reduce)")
                          .matches
                          ? 0
                          : 950,
                      );
                      followAgent.current = true;
                      setSelected(waiting);
                      gate.current?.();
                    } catch {
                      /* Stopping during transfer keeps the recorded work. */
                    } finally {
                      setTransferring(false);
                    }
                  }}
                >
                  {tr("Continue to")}{" "}
                  {tr(agentDefinitions.find((a) => a.id === waiting)!.name)}{" "}
                  <Icon />
                </Button>
              </>
            ) : busy ? (
              <>
                <span>
                  <i className="working-light" />{" "}
                  {tr("Recording actions as they happen…")}
                </span>
              </>
            ) : last?.status === "complete" ? (
              <>
                <div>
                  <strong>{tr("Investigation complete")}</strong>
                  <p>
                    {tr(
                      "Your next step: compare the evidence and choose a direction.",
                    )}
                  </p>
                </div>
                <Button
                  data-tour="compare"
                  to={`/community/${id}/opportunities`}
                >
                  {tr("Compare the findings")} <Icon />
                </Button>
              </>
            ) : (
              <p>
                {tr(
                  last?.status === "failed"
                    ? "This run stopped. Its recorded actions are saved. Start a new investigation when you are ready."
                    : "Start the investigation above. Every action will appear here.",
                )}
              </p>
            )}
            {busy && (
              <button
                className="quiet-link"
                onClick={() => abort.current?.abort()}
              >
                {tr("Stop investigation")}
              </button>
            )}
          </div>
        </div>
      </section>
      <section className="agent-result">
        <div>
          <span className="eyebrow">{tr("INSPECT AN AGENT'S WORK")}</span>
          <h2>{tr(agentDefinitions.find((a) => a.id === selected)!.name)}</h2>
          <p>
            {tr(agentDefinitions.find((a) => a.id === selected)!.description)}
          </p>
        </div>
        <div>
          {selectedStep ? (
            <>
              <span className="eyebrow">{tr("INPUT")}</span>
              <p>{tr(selectedStep.input || "Reading permitted inputs…")}</p>
              <span className="eyebrow">{tr("FINDINGS & HANDOFF")}</span>
              {selectedStep.status === "running" ? (
                <p role="status">{tr("Working now")}</p>
              ) : (
                <CitedOutput
                  text={selectedStep.output}
                  local={displayMode === "local"}
                  citations={selectedStep.citations}
                />
              )}
            </>
          ) : (
            <p>
              {tr(
                "Select a completed agent to inspect its inputs, findings and sources.",
              )}
            </p>
          )}
        </div>
      </section>
      <p className="micro">
        {tr(
          "Actions, inputs, outputs and sources are recorded here. Private model reasoning is not exposed. Municipal approval always stays with people.",
        )}
      </p>
      {last && !busy && (
        <a
          className="quiet-link research-export"
          download={`elsewhere-${id}-research-${last.id.slice(0, 8)}.json`}
          href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ disclosure: id === DEMO_ID ? "DEMO: sample reports, real project sources" : "Research record; not municipal approval", ...last }, null, 2))}`}
        >
          <Icon name="download" size={16} />
          {tr("Download the complete activity record")}
        </a>
      )}
      <details className="agent-history">
        <summary>
          {tr("Run history")} · {civic.runs.length}
        </summary>
        {civic.runs.map((r) => (
          <article key={r.id}>
            <div>
              <strong>
                {tr(r.mode === "ai" ? "Live AI research" : "Local analysis")} ·{" "}
                {tr(r.status)}
              </strong>
              <p>
                {new Date(r.startedAt).toLocaleString(locale())} ·{" "}
                {r.events?.length || 0} {tr("recorded actions")}
              </p>
              {r.error && <p>{tr(r.error)}</p>}
            </div>
            <Button
              secondary
              disabled={busy}
              onClick={() => {
                setViewId(r.id);
                setSelected(r.steps.at(-1)?.id || "listener");
                document
                  .getElementById("agent-workbench")
                  ?.scrollIntoView({ block: "start", behavior: "instant" });
              }}
            >
              {tr("Inspect this run")}
            </Button>
          </article>
        ))}
      </details>
    </div>
  );
}
