import { t as tr, locale } from "./i18n";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon } from "./components";
import { useCivic } from "./CivicContext";
import { runFingerprint, topicLabels } from "./civicEngine";
import { Missing } from "./Workspace";
import { examples } from "./data";
import { SourceList } from "./SourceList";
import { getSource } from "./sources";
import { CitedOutput } from "./AgentStudio";
export default function Opportunities() {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
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
        [key]: {
          state,
          note,
          runId: run?.id,
          at: new Date().toISOString(),
        },
      },
    }));
    setError("");
  }
  const decision = (key: string) => (
    <div className="opportunity-decision">
      {tr(
        civic.decisions[key] && (
          <p className="decision-record">
            <strong>
              {tr(
                civic.decisions[key].state === "shortlist"
                  ? "Shortlisted by advisor"
                  : "Held by advisor",
              )}
              {tr(":")}
            </strong>
            {tr(" ")}
            {tr(civic.decisions[key].note)}
            {tr(" ")}
            <small>
              {tr(new Date(civic.decisions[key].at).toLocaleString(locale()))}
            </small>
          </p>
        ),
      )}
      <label htmlFor={`decision-${key}`}>
        {tr("Your decision and justification")}
      </label>
      <textarea
        id={`decision-${key}`}
        placeholder={tr(
          "What evidence supports further review, or what still needs checking?",
        )}
        value={notes[key] || ""}
        onChange={(e) =>
          setNotes((n) => ({
            ...n,
            [key]: e.target.value,
          }))
        }
      />
      <div className="actions">
        <Button
          secondary
          disabled={stale || !run}
          onClick={() => decide(key, "shortlist")}
        >
          {tr("Shortlist for human review ")}
          <Icon name="check" size={16} />
        </Button>
        <button
          className="quiet-link"
          disabled={stale || !run}
          onClick={() => decide(key, "hold")}
        >
          {tr("Hold for more evidence")}
        </button>
      </div>
      <small>
        {tr(
          "A recorded advisor decision, not agent approval or permission to implement.",
        )}
      </small>
    </div>
  );
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">{tr("FROM EVIDENCE TO A DECISION")}</span>
          <h1>
            {tr("A possibility.")}
            <br />
            <span className="blue-text">{tr("With a reason.")}</span>
          </h1>
        </div>
        <p>
          {tr(
            "Understand the local need, inspect what another city tried and see every condition behind the recommendation.",
          )}
        </p>
      </div>
      {tr(
        !run ? (
          <div className="civic-empty">
            <h2>{tr("Start with a research run.")}</h2>
            <p>
              {tr(
                "Your agent team will connect shared local context and resident needs to documented projects.",
              )}
            </p>
            <Button to={`/community/${id}/agents`}>
              {tr("Open the agent studio ")}
              <Icon />
            </Button>
          </div>
        ) : (
          <>
            {tr(
              stale && (
                <div className="agent-notice">
                  {tr(
                    "Inputs changed after this run. These results are a historical snapshot.",
                  )}
                  {tr(" ")}
                  <Link to={`/community/${id}/agents`}>
                    {tr("Refresh the analysis ↗")}
                  </Link>
                </div>
              ),
            )}
            <div className="opportunity-tabs">
              {tr(
                [
                  ["leads", `Research leads · ${run.opportunities.length}`],
                  ["ideas", `Resident ideas · ${run.ideas.length}`],
                  ["decisions", `Decision queue · ${shortlist.length}`],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    aria-pressed={tab === key}
                    onClick={() => setTab(key)}
                  >
                    {tr(label)}
                  </button>
                )),
              )}
            </div>
            <p className="micro">
              {tr(
                tab === "leads"
                  ? "Ordered by eligible complaint volume, then recorded readiness. Unknown costs and permissions remain unknown."
                  : tab === "ideas"
                    ? "Ideas with missing evidence are held out of the decision queue. Advisors can explicitly escalate a case with a written reason."
                    : "Only ideas explicitly shortlisted by an advisor appear here. No automated municipal approval is implied.",
              )}
            </p>
            {tr(
              error && (
                <p role="alert" className="form-error">
                  {tr(error)}
                </p>
              ),
            )}
            {tr(
              tab === "leads" && (
                <>
                  <div className="opportunity-list">
                    {tr(
                      run.opportunities.map((o, i) => {
                        const ex = examples.find((e) => e.id === o.exampleId)!;
                        return (
                          <article key={o.exampleId} className="research-lead">
                            <div className="lead-header">
                              <span className="lead-index">
                                {tr(String(i + 1).padStart(2, "0"))}
                              </span>
                              <div>
                                <span className="eyebrow">
                                  {tr(ex.origin.name.toUpperCase())}
                                  {tr(" /")}
                                  {tr(" ")}
                                  {tr(ex.origin.country.toUpperCase())}
                                </span>
                                <h2>{tr(ex.title)}</h2>
                              </div>
                              <span
                                className={`tag ${o.state === "hold" ? "blocked" : "unknown"}`}
                              >
                                {tr(
                                  o.state === "hold"
                                    ? "Blocked by local constraints"
                                    : o.state === "ready"
                                      ? "Recorded checks align"
                                      : "Local evidence needed",
                                )}
                              </span>
                            </div>
                            <div className="lead-summary">
                              <span>
                                <strong>{tr(o.reportCount)}</strong>
                                {tr(" related complaints")}
                              </span>
                              <span>{tr(topicLabels[o.topic])}</span>
                              <p>{tr(o.reason)}</p>
                            </div>
                            <details className="fit-ledger" open={i === 0}>
                              <summary>
                                {tr("Why this idea appeared")}
                                {tr(" ")}
                                <span>
                                  {tr(
                                    o.factors.filter(
                                      (f) => f.state === "aligned",
                                    ).length,
                                  )}
                                  {tr(" ")}
                                  {tr("supported connections ·")}
                                  {tr(" ")}
                                  {tr(
                                    o.factors.filter(
                                      (f) => f.state === "unknown",
                                    ).length,
                                  )}
                                  {tr(" ")}
                                  {tr("unknowns ")}
                                  <Icon name="plus" size={16} />
                                </span>
                              </summary>
                              {tr(
                                o.factors.map((f) => (
                                  <div className="fit-factor" key={f.name}>
                                    <span className={`factor-state ${f.state}`}>
                                      {tr(
                                        f.state === "aligned"
                                          ? "↗"
                                          : f.state === "blocked"
                                            ? "×"
                                            : "?",
                                      )}
                                    </span>
                                    <div>
                                      <h3>
                                        {tr(f.name)}
                                        <small>{tr(f.state)}</small>
                                      </h3>
                                      <p>{tr(f.detail)}</p>
                                      {tr(
                                        f.sources?.length ? (
                                          <SourceList ids={f.sources} compact />
                                        ) : null,
                                      )}
                                    </div>
                                  </div>
                                )),
                              )}
                            </details>
                            <div className="lead-actions">
                              <Button
                                secondary
                                to={`/community/${id}/matches/${o.exampleId}`}
                              >
                                {tr("Inspect & adapt this idea ")}
                                <Icon />
                              </Button>
                              <span>
                                {tr("Source authority:")}
                                {tr(" ")}
                                {tr(
                                  ex.sources
                                    .map((id) => getSource(id)?.publisher)
                                    .filter(Boolean)
                                    .join(" / ") || "To verify",
                                )}
                                {tr(" ")}
                                {tr("· No partnership implied")}
                              </span>
                            </div>
                            <details className="advisor-decision-disclosure">
                              <summary>
                                {tr("Record an advisor decision")}
                                {tr(" ")}
                                <Icon name="plus" size={16} />
                              </summary>
                              {tr(decision(o.exampleId))}
                            </details>
                          </article>
                        );
                      }),
                    )}
                  </div>
                  {tr(
                    !run.opportunities.length && (
                      <div className="civic-empty">
                        <h2>{tr("No supported approach in this run.")}</h2>
                        <p>
                          {tr(
                            "Share the project repository and municipal context, or connect live AI research to investigate beyond the five-project catalogue.",
                          )}
                        </p>
                      </div>
                    ),
                  )}
                  {tr(
                    run.mode === "ai" && (
                      <section className="live-research-memo">
                        <span className="eyebrow">
                          {tr("BEYOND THE CURATED LIBRARY / LIVE AI RESEARCH")}
                        </span>
                        <h2>{tr("Discoveries from the research scout.")}</h2>
                        <p>
                          {tr(
                            "AI-generated leads require source verification. They are not automatically added as verified projects or approved ideas.",
                          )}
                        </p>
                        <CitedOutput
                          text={
                            run.steps.find((s) => s.id === "scout")?.output ||
                            "No scout output recorded."
                          }
                          citations={
                            run.steps.find((s) => s.id === "scout")
                              ?.citations || []
                          }
                        />
                        <details>
                          <summary>
                            {tr("Read the transferability assessment")}
                          </summary>
                          <CitedOutput
                            text={
                              run.steps.find((s) => s.id === "reviewer")
                                ?.output || ""
                            }
                            citations={
                              run.steps.find((s) => s.id === "reviewer")
                                ?.citations || []
                            }
                          />
                        </details>
                      </section>
                    ),
                  )}
                </>
              ),
            )}
            {tr(
              tab === "ideas" && (
                <div className="intake-list">
                  {tr(
                    run.ideas.map((idea) => {
                      const r = civic.reports.find(
                        (r) => r.id === idea.reportId,
                      );
                      return r ? (
                        <article key={idea.reportId}>
                          <span className="tag">
                            {tr(
                              idea.state === "hold"
                                ? "Held for investigation"
                                : "Agent checks complete · advisor review",
                            )}
                          </span>
                          <h3>{r.title}</h3>
                          <p>{r.detail}</p>
                          <div className="idea-gate">
                            <Icon name="pin" size={20} />
                            <p>{tr(idea.reason)}</p>
                          </div>
                          {tr(decision(`idea:${r.id}`))}
                        </article>
                      ) : null;
                    }),
                  )}
                  {tr(
                    !run.ideas.length && (
                      <div className="civic-empty">
                        <h2>{tr("No resident ideas in this run.")}</h2>
                        <p>
                          {tr(
                            "Invite input through the resident space. Submitted ideas will be screened against local conditions.",
                          )}
                        </p>
                        <Button secondary to={`/report/${id}`}>
                          {tr("Open resident space ")}
                          <Icon />
                        </Button>
                      </div>
                    ),
                  )}
                </div>
              ),
            )}
            {tr(
              tab === "decisions" && (
                <div className="decision-queue">
                  {tr(
                    shortlist.length ? (
                      shortlist.map(([key, d]) => (
                        <article key={key}>
                          <span className="eyebrow">
                            {tr("SHORTLISTED FOR HUMAN REVIEW")}
                          </span>
                          <h2>
                            {tr(
                              key.startsWith("idea:")
                                ? civic.reports.find(
                                    (r) => r.id === key.slice(5),
                                  )?.title
                                : examples.find((e) => e.id === key)?.title,
                            )}
                          </h2>
                          <p>{d.note}</p>
                          <small>
                            {tr(new Date(d.at).toLocaleString(locale()))}
                            {tr(" ·")}
                            {tr(" ")}
                            {tr(civic.authority.name || "Authority to confirm")}
                          </small>
                          <p className="micro">
                            {tr(
                              stale || d.runId !== run.id
                                ? "This decision predates the current evidence. Review it again before advancing."
                                : "Review local evidence and responsible authority before deciding to pilot.",
                            )}
                          </p>
                        </article>
                      ))
                    ) : (
                      <div className="civic-empty">
                        <h2>{tr("Nothing has been approved by default.")}</h2>
                        <p>
                          {tr(
                            "Research leads and resident ideas stay outside this queue until an advisor records a reason to shortlist them.",
                          )}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              ),
            )}
            <div className="civic-next">
              <Link className="quiet-link" to={`/community/${id}/agents`}>
                {tr("Read the full agent trail ")}
                <Icon size={16} />
              </Link>
              <Link className="quiet-link" to={`/community/${id}/matches`}>
                {tr("Browse the complete project library ")}
                <Icon size={16} />
              </Link>
            </div>
          </>
        ),
      )}
    </div>
  );
}
