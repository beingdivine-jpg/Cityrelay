import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon, useApp } from "./components";
import { useCivic } from "./CivicContext";
import { runFingerprint, topicLabels } from "./civicEngine";
import { Missing } from "./Workspace";
import { examples } from "./data";
import { SourceList } from "./SourceList";
import { CitedOutput } from "./AgentStudio";
import type { Domain } from "./model";
export default function Opportunities() {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
  const { saveProfile } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("leads"),
    [notes, setNotes] = useState<Record<string, string>>({}),
    [error, setError] = useState("");
  if (!profile || !civic) return <Missing />;
  const run = civic.runs.find((r) => r.status === "complete");
  const stale = !!run && run.fingerprint !== runFingerprint(profile, civic);
  const shortlist = Object.entries(civic.decisions).filter(
    ([, d]) => d.state === "shortlist",
  );
  function decide(key: string, state: "shortlist" | "hold") {
    const note = notes[key]?.trim();
    if (!note || note.length < 10) {
      setError("Record at least 10 characters explaining your decision.");
      return;
    }
    change((c) => ({
      ...c,
      decisions: {
        ...c.decisions,
        [key]: { state, note, runId: run?.id, at: new Date().toISOString() },
      },
    }));
    setError("");
  }
  const decision = (key: string) => (
    <div className="opportunity-decision">
      {civic.decisions[key] && (
        <p className="decision-record">
          <strong>
            {civic.decisions[key].state === "shortlist"
              ? "Shortlisted by advisor"
              : "Held by advisor"}
            :
          </strong>{" "}
          {civic.decisions[key].note}{" "}
          <small>{new Date(civic.decisions[key].at).toLocaleString()}</small>
        </p>
      )}
      <label htmlFor={`decision-${key}`}>Your decision and justification</label>
      <textarea
        id={`decision-${key}`}
        placeholder="What evidence supports further review, or what still needs checking?"
        value={notes[key] || ""}
        onChange={(e) => setNotes((n) => ({ ...n, [key]: e.target.value }))}
      />
      <div className="actions">
        <Button
          secondary
          disabled={stale || !run}
          onClick={() => decide(key, "shortlist")}
        >
          Shortlist for human review <Icon name="check" size={16} />
        </Button>
        <button
          className="quiet-link"
          disabled={stale || !run}
          onClick={() => decide(key, "hold")}
        >
          Hold for more evidence
        </button>
      </div>
      <small>
        A recorded advisor decision, not agent approval or permission to
        implement.
      </small>
    </div>
  );
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">04 / FROM EVIDENCE TO A DECISION</span>
          <h1>
            A possibility.
            <br />
            <span className="blue-text">With a reason.</span>
          </h1>
        </div>
        <p>
          Understand the local need, inspect what another city tried and see
          every condition behind the recommendation.
        </p>
      </div>
      {!run ? (
        <div className="civic-empty">
          <h2>Start with a research run.</h2>
          <p>
            Your agent team will connect shared local context and resident needs
            to documented projects.
          </p>
          <Button to={`/community/${id}/agents`}>
            Open the agent studio <Icon />
          </Button>
        </div>
      ) : (
        <>
          {stale && (
            <div className="agent-notice">
              Inputs changed after this run. These results are a historical
              snapshot.{" "}
              <Link to={`/community/${id}/agents`}>Refresh the analysis ↗</Link>
            </div>
          )}
          <div className="opportunity-tabs">
            {[
              ["leads", `Research leads · ${run.opportunities.length}`],
              ["ideas", `Resident ideas · ${run.ideas.length}`],
              ["decisions", `Decision queue · ${shortlist.length}`],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={tab === key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="micro">
            {tab === "leads"
              ? "Ordered by eligible complaint volume, then recorded readiness. Unknown costs and permissions remain unknown."
              : tab === "ideas"
                ? "Ideas with missing evidence are held out of the decision queue. Advisors can explicitly escalate a case with a written reason."
                : "Only ideas explicitly shortlisted by an advisor appear here. No automated municipal approval is implied."}
          </p>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {tab === "leads" && (
            <>
              <div className="opportunity-list">
                {run.opportunities.map((o, i) => {
                  const ex = examples.find((e) => e.id === o.exampleId)!;
                  return (
                    <article key={o.exampleId} className="research-lead">
                      <div className="lead-header">
                        <span className="lead-index">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <span className="eyebrow">
                            {ex.origin.name.toUpperCase()} /{" "}
                            {ex.origin.country.toUpperCase()}
                          </span>
                          <h2>{ex.title}</h2>
                        </div>
                        <span
                          className={`tag ${o.state === "hold" ? "blocked" : "unknown"}`}
                        >
                          {o.state === "hold"
                            ? "Blocked by local constraints"
                            : o.state === "ready"
                              ? "Recorded checks align"
                              : "Local evidence needed"}
                        </span>
                      </div>
                      <div className="lead-summary">
                        <span>
                          <strong>{o.reportCount}</strong> related complaints
                        </span>
                        <span>{topicLabels[o.topic]}</span>
                        <p>{o.reason}</p>
                      </div>
                      <details className="fit-ledger" open={i === 0}>
                        <summary>
                          Why this idea appeared{" "}
                          <span>
                            {
                              o.factors.filter((f) => f.state === "aligned")
                                .length
                            }{" "}
                            supported connections ·{" "}
                            {
                              o.factors.filter((f) => f.state === "unknown")
                                .length
                            }{" "}
                            unknowns <Icon name="plus" size={16} />
                          </span>
                        </summary>
                        {o.factors.map((f) => (
                          <div className="fit-factor" key={f.name}>
                            <span className={`factor-state ${f.state}`}>
                              {f.state === "aligned"
                                ? "↗"
                                : f.state === "blocked"
                                  ? "×"
                                  : "?"}
                            </span>
                            <div>
                              <h3>
                                {f.name}
                                <small>{f.state}</small>
                              </h3>
                              <p>{f.detail}</p>
                              {f.sources?.length ? (
                                <SourceList ids={f.sources} compact />
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </details>
                      <div className="lead-actions">
                        <Button
                          secondary
                          onClick={() => {
                            saveProfile({
                              ...profile,
                              problems: [o.topic as Domain],
                              updatedAt: new Date().toISOString(),
                            });
                            navigate(`/community/${id}/matches/${o.exampleId}`);
                          }}
                        >
                          Inspect & adapt this idea <Icon />
                        </Button>
                        <span>
                          Source authority:{" "}
                          {ex.sources.length
                            ? "Documented public body"
                            : "To verify"}{" "}
                          · No partnership implied
                        </span>
                      </div>
                      <details className="advisor-decision-disclosure">
                        <summary>
                          Record an advisor decision{" "}
                          <Icon name="plus" size={16} />
                        </summary>
                        {decision(o.exampleId)}
                      </details>
                    </article>
                  );
                })}
              </div>
              {!run.opportunities.length && (
                <div className="civic-empty">
                  <h2>No supported approach in this run.</h2>
                  <p>
                    Share the project repository and municipal context, or
                    connect live AI research to investigate beyond the
                    five-project catalogue.
                  </p>
                </div>
              )}
              {run.mode === "ai" && (
                <section className="live-research-memo">
                  <span className="eyebrow">
                    BEYOND THE CURATED LIBRARY / LIVE AI RESEARCH
                  </span>
                  <h2>Discoveries from the research scout.</h2>
                  <p>
                    AI-generated leads require source verification. They are not
                    automatically added as verified projects or approved ideas.
                  </p>
                  <CitedOutput
                    text={
                      run.steps.find((s) => s.id === "scout")?.output ||
                      "No scout output recorded."
                    }
                    citations={
                      run.steps.find((s) => s.id === "scout")?.citations || []
                    }
                  />
                  <details>
                    <summary>Read the transferability assessment</summary>
                    <CitedOutput
                      text={
                        run.steps.find((s) => s.id === "reviewer")?.output || ""
                      }
                      citations={
                        run.steps.find((s) => s.id === "reviewer")?.citations ||
                        []
                      }
                    />
                  </details>
                </section>
              )}
            </>
          )}
          {tab === "ideas" && (
            <div className="intake-list">
              {run.ideas.map((idea) => {
                const r = civic.reports.find((r) => r.id === idea.reportId);
                return r ? (
                  <article key={idea.reportId}>
                    <span className="tag">
                      {idea.state === "hold"
                        ? "Held for investigation"
                        : "Agent checks complete · advisor review"}
                    </span>
                    <h3>{r.title}</h3>
                    <p>{r.detail}</p>
                    <div className="idea-gate">
                      <Icon name="pin" size={20} />
                      <p>{idea.reason}</p>
                    </div>
                    {decision(`idea:${r.id}`)}
                  </article>
                ) : null;
              })}
              {!run.ideas.length && (
                <div className="civic-empty">
                  <h2>No resident ideas in this run.</h2>
                  <p>
                    Invite input through the resident space. Submitted ideas
                    will be screened against local conditions.
                  </p>
                  <Button secondary to={`/report/${id}`}>
                    Open resident space <Icon />
                  </Button>
                </div>
              )}
            </div>
          )}
          {tab === "decisions" && (
            <div className="decision-queue">
              {shortlist.length ? (
                shortlist.map(([key, d]) => (
                  <article key={key}>
                    <span className="eyebrow">
                      SHORTLISTED FOR HUMAN REVIEW
                    </span>
                    <h2>
                      {key.startsWith("idea:")
                        ? civic.reports.find((r) => r.id === key.slice(5))
                            ?.title
                        : examples.find((e) => e.id === key)?.title}
                    </h2>
                    <p>{d.note}</p>
                    <small>
                      {new Date(d.at).toLocaleString()} ·{" "}
                      {civic.authority.name || "Authority to confirm"}
                    </small>
                    <p className="micro">
                      {stale || d.runId !== run.id
                        ? "This decision predates the current evidence. Review it again before advancing."
                        : "Review local evidence and responsible authority before deciding to pilot."}
                    </p>
                  </article>
                ))
              ) : (
                <div className="civic-empty">
                  <h2>Nothing has been approved by default.</h2>
                  <p>
                    Research leads and resident ideas stay outside this queue
                    until an advisor records a reason to shortlist them.
                  </p>
                </div>
              )}
            </div>
          )}
          <div className="civic-next">
            <Link className="quiet-link" to={`/community/${id}/agents`}>
              Read the full agent trail <Icon size={16} />
            </Link>
            <Link className="quiet-link" to={`/community/${id}/matches`}>
              Browse the complete project library <Icon size={16} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
