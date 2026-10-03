import { t as tr, locale, getLanguage } from "./i18n";
import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon } from "./components";
import { useAgentService, useCivic } from "./CivicContext";
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
import type {
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
  const service = useAgentService();
  const [mode, setMode] = useState<"local" | "ai">("local"),
    [selected, setSelected] = useState<AgentKey>("listener"),
    [liveSteps, setLiveSteps] = useState<AgentStep[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [replay, setReplay] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const last = civic?.runs[0];
  const steps = busy ? liveSteps : last?.steps || [];
  const selectedStep = steps.find((s) => s.id === selected);
  useEffect(() => {
    if (!replay) return;
    let i = 0;
    setSelected("listener");
    const timer = setInterval(() => {
      i++;
      if (i >= agentDefinitions.length) {
        setReplay(false);
        clearInterval(timer);
      } else setSelected(agentDefinitions[i].id);
    }, 1400);
    return () => clearInterval(timer);
  }, [replay]);
  if (!profile || !civic) return <Missing />;
  const updateStep = (step: AgentStep) => {
    setLiveSteps((list) => [...list.filter((s) => s.id !== step.id), step]);
    setSelected(step.id);
  };
  async function run() {
    if (!profile || !civic || busy) return;
    setBusy(true);
    setReplay(false);
    setError("");
    setLiveSteps([]);
    const snapshot = structuredClone(civic),
      place = structuredClone(profile);
    const startedAt = new Date().toISOString();
    let result: AgentRun | undefined;
    let completedSteps: AgentStep[] = [];
    try {
      if (mode === "local")
        result = await localAnalysis(place, snapshot, updateStep);
      else {
        abort.current = new AbortController();
        const response = await fetch("/api/research", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profile: place,
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
          signal: abort.current.signal,
        });
        if (!response.ok) {
          const msg = await response.json().catch(() => ({
            error: "Research service unavailable.",
          }));
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
            updateStep(event.step);
            if (event.step.status === "complete")
              completedSteps = [
                ...completedSteps.filter((s) => s.id !== event.step.id),
                event.step,
              ];
          }
          if (event.type === "done") done = true;
        };
        try {
          while (true) {
            const part = await reader.read();
            if (part.done) break;
            buffer += decoder.decode(part.value, {
              stream: true,
            });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            lines.forEach(consume);
          }
          if (buffer.trim()) consume(buffer);
        } finally {
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
          signals,
          opportunities,
          ideas: triageIdeas(reports, opportunities),
          reportCount: reports.filter(
            (r) => !r.duplicateOf && r.status === "received",
          ).length,
        };
      }
      const finished = result;
      change((c) => ({
        ...c,
        runs: [finished, ...c.runs].slice(0, 20),
        notices: [
          {
            id: `run-${finished.id}`,
            title:
              mode === "ai"
                ? "AI research is ready for review"
                : "Local analysis is ready for review",
            detail: `${finished.reportCount} eligible submissions · ${finished.opportunities.length} documented leads. Open the evidence trail before making a decision.`,
            at: finished.completedAt,
            read: false,
            kind: "analysis" as const,
          },
          ...c.notices,
        ].slice(0, 100),
      }));
      setSelected("writer");
      if (
        mode === "local" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        setReplay(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Analysis failed.";
      setError(message);
      if (mode === "ai") {
        const failed: AgentRun = {
          id: crypto.randomUUID(),
          startedAt,
          completedAt: new Date().toISOString(),
          mode,
          status: "failed",
          fingerprint: runFingerprint(place, snapshot),
          steps: completedSteps,
          signals: [],
          opportunities: [],
          ideas: [],
          reportCount: 0,
          error: message,
        };
        change((c) => ({
          ...c,
          runs: [failed, ...c.runs].slice(0, 20),
        }));
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">{tr("RESEARCH YOU CAN FOLLOW")}</span>
          <h1>
            {tr("No black box.")}
            <br />
            <span className="blue-text">{tr("Meet your agents.")}</span>
          </h1>
        </div>
        <p>
          {tr(
            "See what each specialist receives, what it finds and what gets passed on. Evidence is visible. Approval stays with your team.",
          )}
        </p>
      </div>
      <section className="agent-control">
        <div>
          <span className={`service-indicator ${service.ai ? "live" : ""}`}>
            <i />
            {tr(service.message)}
          </span>
          <h2>
            {tr("A research run for ")}
            {profile.name}
            {tr(".")}
          </h2>
          <p>
            {tr(
              `${civic.reports.length} submissions · ${civic.connections.filter((c) => c.enabled).length} shared data groups · ${civic.documents.filter((d) => d.enabled).length} local documents`,
            )}
          </p>
          <Link className="quiet-link" to={`/community/${id}/data`}>
            {tr("Review data access ")}
            <Icon size={15} />
          </Link>
        </div>
        <div className="agent-run-options">
          <div className="agent-mode-switch">
            <button
              disabled={busy}
              aria-pressed={mode === "local"}
              onClick={() => setMode("local")}
            >
              {tr("Local analysis")}
            </button>
            <button
              disabled={busy || !service.ai}
              aria-pressed={mode === "ai"}
              onClick={() => setMode("ai")}
            >
              {tr("Live AI research ")}
              {tr(service.ai ? "↗" : "· not connected")}
            </button>
          </div>
          <p>
            {tr(
              mode === "local"
                ? "Runs real grouping, catalogue retrieval and rule-based checks on this device. No LLM or live web search is claimed."
                : `Five sequential AI specialists using ${service.model}; the scout searches approved municipal sources. Outputs require human verification.`,
            )}
          </p>
          {tr(
            mode === "ai" && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                <span>
                  {tr(
                    "Send the shared municipal brief, permitted reports and permitted documents to OpenAI for this run. Usage may incur API costs.",
                  )}
                </span>
              </label>
            ),
          )}
          <Button
            disabled={
              busy ||
              (mode === "ai" && (!consent || !allowed(civic, "catalogue")))
            }
            onClick={() => void run()}
          >
            {tr(
              busy
                ? "Agents are processing…"
                : mode === "local"
                  ? "Run local analysis"
                  : "Start live AI research",
            )}
            <Icon name={busy ? "sun" : "arrow"} />
          </Button>
          {tr(
            busy && mode === "ai" && (
              <button
                className="quiet-link"
                onClick={() => abort.current?.abort()}
              >
                {tr("Cancel research")}
              </button>
            ),
          )}
        </div>
      </section>
      {tr(
        replay && (
          <p className="agent-notice" role="status">
            {tr(
              "Analysis finished. Replaying the recorded handoffs so you can follow the work.",
            )}
          </p>
        ),
      )}
      {tr(
        !civic.authority.confirmed && (
          <div className="agent-notice">
            {tr(
              "The responsible authority has not been confirmed. The agents will keep this visible as an unresolved check.",
            )}
            {tr(" ")}
            <Link to={`/community/${id}/data`}>{tr("Review authority ↗")}</Link>
          </div>
        ),
      )}
      {tr(
        error && (
          <p role="alert" className="form-error agent-error">
            {tr(error)}
          </p>
        ),
      )}
      <div
        className={`agent-pipeline ${busy ? "is-running" : ""} ${replay ? "is-replaying" : ""}`}
        aria-label={tr("Agent research pipeline")}
      >
        {tr(
          agentDefinitions.map((a, i) => {
            const step = steps.find((s) => s.id === a.id);
            return (
              <button
                key={a.id}
                onClick={() => {
                  setReplay(false);
                  setSelected(a.id);
                }}
                className={`${selected === a.id ? "selected" : ""} ${step?.status === "running" ? "processing" : ""}`}
                aria-pressed={selected === a.id}
              >
                <span className="pipeline-node">
                  <span>{tr(String(i + 1).padStart(2, "0"))}</span>
                  {tr(
                    step?.status === "complete" ? (
                      <Icon name="check" size={15} />
                    ) : (
                      <i />
                    ),
                  )}
                </span>
                <strong>{tr(a.name)}</strong>
                <small>
                  {tr(
                    step?.status === "running"
                      ? "Working now"
                      : step?.status === "complete"
                        ? "Output ready"
                        : a.verb,
                  )}
                </small>
              </button>
            );
          }),
        )}
      </div>
      <div className="agent-inspector">
        <aside>
          <span className="eyebrow">
            {tr(replay ? "REPLAYING A COMPLETED RUN" : "INSIDE THE WORKFLOW")}
          </span>
          <h2>{tr(agentDefinitions.find((a) => a.id === selected)?.name)}</h2>
          <p>
            {tr(agentDefinitions.find((a) => a.id === selected)?.description)}
          </p>
          {tr(
            last && !busy && (
              <>
                <small>
                  {tr(last.mode === "ai" ? "AI research" : "Local rules")}
                  {tr(" ·")}
                  {tr(" ")}
                  {tr(new Date(last.completedAt).toLocaleString(locale()))}
                </small>
                <button
                  className="quiet-link"
                  onClick={() => setReplay(!replay)}
                >
                  {tr(replay ? "Stop replay" : "Replay the handoffs")}
                  {tr(" ")}
                  <span>{tr(replay ? "Ⅱ" : "▷")}</span>
                </button>
              </>
            ),
          )}
          <div className="agent-audit-note">
            {tr(
              "This is an action and evidence trail. It shows inputs, outputs and sources—not private model reasoning.",
            )}
          </div>
        </aside>
        <div className="agent-evidence" aria-live="polite">
          {tr(
            selectedStep ? (
              <>
                <div className="agent-input">
                  <span>{tr("INPUT")}</span>
                  <p>{tr(selectedStep.input || "Reading permitted inputs…")}</p>
                </div>
                <div className="agent-output">
                  <div className="civic-section-title">
                    <span className="eyebrow">
                      {tr(
                        selectedStep.status === "running"
                          ? "PROCESSING"
                          : "FINDINGS & HANDOFF",
                      )}
                    </span>
                    <span className="tag">
                      {tr(
                        last?.mode === "ai" && !busy
                          ? "AI-generated · verify sources"
                          : mode === "ai" && busy
                            ? "AI agent"
                            : "Deterministic local processing",
                      )}
                    </span>
                  </div>
                  {tr(
                    selectedStep.status === "running" ? (
                      <div className="agent-processing">
                        <i />
                        <i />
                        <i />
                        <p>
                          {tr(
                            "The agent is working with its permitted inputs.",
                          )}
                        </p>
                      </div>
                    ) : (
                      <CitedOutput
                        local={
                          mode === "local" && (!last || last.mode === "local")
                        }
                        text={selectedStep.output}
                        citations={selectedStep.citations}
                      />
                    ),
                  )}
                </div>
              </>
            ) : (
              <div className="agent-waiting">
                <div className="listening-art" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <h3>{tr("A visible trail starts with a run.")}</h3>
                <p>
                  {tr(
                    "Start local analysis to inspect the actual inputs, grouping rules, retrieved projects and transfer checks. Connect server-side AI for live research.",
                  )}
                </p>
              </div>
            ),
          )}
        </div>
      </div>
      {tr(
        last?.status === "complete" && !busy && (
          <div className="civic-next">
            <p>
              {tr(
                "The research is complete. Review the evidence, resolve unknowns, then choose what deserves a local pilot.",
              )}
            </p>
            <Button to={`/community/${id}/opportunities`}>
              {tr("Review the opportunities ")}
              <Icon />
            </Button>
          </div>
        ),
      )}
      {tr(
        last && !busy && (
          <a
            className="quiet-link research-export"
            download={`elsewhere-${id}-research-${last.id.slice(0, 8)}.md`}
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(`# ${profile.name} — ${tr("research record")}\n\n${tr(last.mode === "ai" ? "AI research; verify sources" : "Deterministic local analysis")} · ${tr(last.status)} · ${last.completedAt}\n\n${last.steps.map((step) => `## ${tr(step.title)}\n\n${tr("Input")}: ${tr(step.input)}\n\n${last.mode === "local" ? tr(step.output) : step.output}\n\n${step.citations.map((c) => `- [${c.title}](${c.url})`).join("\n")}`).join("\n\n")}\n\n${tr("Unresolved local checks require human review. This record is not municipal approval.")}`)}`}
          >
            <Icon name="download" size={16} />
            {tr(" Download this research record")}
          </a>
        ),
      )}
      <details className="agent-history">
        <summary>
          {tr("Run history ")}
          <span>
            {tr(civic.runs.length)}
            {tr(" recorded runs")}
          </span>
        </summary>
        {tr(
          civic.runs.map((r) => (
            <article key={r.id}>
              <div>
                <strong>
                  {tr(r.mode === "ai" ? "Live AI research" : "Local analysis")}
                  {tr(" ·")}
                  {tr(" ")}
                  {tr(r.status)}
                </strong>
                <p>
                  {tr(new Date(r.startedAt).toLocaleString(locale()))}
                  {tr(" · ")}
                  {tr(r.reportCount)}
                  {tr(" ")}
                  {tr("eligible submissions · ")}
                  {tr(r.opportunities.length)}
                  {tr(" catalogue leads")}
                </p>
                {tr(r.error && <p>{tr(r.error)}</p>)}
              </div>
              <details>
                <summary>{tr("Read recorded outputs")}</summary>
                {tr(
                  r.steps.map((s) => (
                    <section key={s.id}>
                      <h3>{tr(s.title)}</h3>
                      <CitedOutput
                        local={r.mode === "local"}
                        text={s.output}
                        citations={s.citations}
                      />
                    </section>
                  )),
                )}
              </details>
            </article>
          )),
        )}
      </details>
    </div>
  );
}
