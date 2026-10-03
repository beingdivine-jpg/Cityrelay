import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon, TextField } from "./components";
import { useCivic } from "./CivicContext";
import { duplicateReport, needsReview, topicLabels } from "./civicEngine";
import { Missing } from "./Workspace";
import type { CivicReport, CivicTopic } from "./civicModel";
export default function ResidentSpace({
  intake = false,
}: {
  intake?: boolean;
}) {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
  const [kind, setKind] = useState<"complaint" | "idea">("complaint"),
    [topic, setTopic] = useState<CivicTopic>("unknown"),
    [title, setTitle] = useState(""),
    [detail, setDetail] = useState(""),
    [area, setArea] = useState(""),
    [consent, setConsent] = useState(false),
    [receipt, setReceipt] = useState(""),
    [error, setError] = useState("");
  if (!profile || !civic) return <Missing />;
  function submit() {
    setError("");
    if (title.trim().length < 5 || detail.trim().length < 20) {
      setError(
        "Add a title of at least 5 characters and at least 20 characters describing the issue or idea.",
      );
      return;
    }
    const report: CivicReport = {
      id: crypto.randomUUID(),
      kind,
      topic,
      title: title.trim().slice(0, 150),
      detail: detail.trim().slice(0, 2000),
      area: area.trim().slice(0, 100),
      externalConsent: consent,
      submittedAt: new Date().toISOString(),
      status: needsReview(title + " " + detail) ? "needs-review" : "received",
      duplicateOf: duplicateReport(civic!.reports, title, detail),
    };
    change((c) => ({
      ...c,
      reports: [report, ...c.reports],
      notices: [
        {
          id: `report-${report.id}`,
          title:
            kind === "complaint"
              ? "A new resident concern"
              : "A new resident idea",
          detail: `${topicLabels[topic]} · ${report.status === "needs-review" ? "Intake review required" : report.duplicateOf ? "Duplicate retained; not counted again" : "Ready for local analysis"}.`,
          at: report.submittedAt,
          read: false,
          kind: "report" as const,
        },
        ...c.notices,
      ].slice(0, 100),
    }));
    setReceipt(report.id);
    setTitle("");
    setDetail("");
  }
  return (
    <div className={`page-width civic-page ${intake ? "" : "resident-page"}`}>
      {intake ? (
        <CommunityNav profile={profile} />
      ) : (
        <Link className="quiet-link" to="/enter">
          <Icon name="back" size={15} /> Municipal workspace
        </Link>
      )}
      <div className="civic-heading">
        <div>
          <span className="eyebrow">
            {intake ? "RESIDENT INTAKE" : "A PLACE FOR YOUR PERSPECTIVE"} /{" "}
            {profile.name.toUpperCase()}
          </span>
          <h1>
            {intake ? (
              <>
                Listen before
                <br />
                <span className="blue-text">you decide.</span>
              </>
            ) : (
              <>
                A better city
                <br />
                <span className="blue-text">starts with you.</span>
              </>
            )}
          </h1>
        </div>
        <p>
          {intake
            ? "Every concern and idea stays visible. Exact duplicates do not inflate demand; ideas with unresolved conditions stay out of the decision queue."
            : "Tell us what could work better, or share an idea worth trying. Your experience gives municipal research a local starting point."}
        </p>
      </div>
      {intake ? (
        <>
          <div className="intake-toolbar">
            <span>{civic.reports.length} submissions on this device</span>
            <Button to={`/report/${id}`}>
              Open resident space <Icon />
            </Button>
          </div>
          {civic.reports.length ? (
            <div className="intake-list">
              {civic.reports.map((r) => (
                <article key={r.id}>
                  <div className="intake-meta">
                    <span className="eyebrow">
                      {r.kind === "idea" ? "IDEA" : "CONCERN"} /{" "}
                      {topicLabels[r.topic]}
                    </span>
                    <span>{new Date(r.submittedAt).toLocaleDateString()}</span>
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.detail}</p>
                  <div className="intake-meta">
                    <span>
                      {r.area || "No neighbourhood specified"} · Unverified
                      submission
                    </span>
                    <span className="tag">
                      {r.duplicateOf
                        ? "Exact duplicate"
                        : r.status === "needs-review"
                          ? "Intake review needed"
                          : "Eligible for analysis"}
                    </span>
                  </div>
                  {r.status === "needs-review" && (
                    <div className="intake-review">
                      <p>
                        May contain contact details or insufficient context.
                        Correct the entry before including it in analysis.
                      </p>
                      <TextField
                        label="Revise title"
                        value={r.title}
                        onChange={(value) =>
                          change((c) => ({
                            ...c,
                            reports: c.reports.map((x) =>
                              x.id === r.id
                                ? { ...x, title: value.slice(0, 150) }
                                : x,
                            ),
                          }))
                        }
                      />
                      <textarea
                        aria-label={`Revise report ${r.title}`}
                        value={r.detail}
                        onChange={(e) =>
                          change((c) => ({
                            ...c,
                            reports: c.reports.map((x) =>
                              x.id === r.id
                                ? { ...x, detail: e.target.value }
                                : x,
                            ),
                          }))
                        }
                      />
                      <Button
                        secondary
                        disabled={
                          r.title.trim().length < 5 ||
                          needsReview(r.title + " " + r.detail)
                        }
                        onClick={() =>
                          change((c) => ({
                            ...c,
                            reports: c.reports.map((x) =>
                              x.id === r.id
                                ? {
                                    ...x,
                                    status: "received",
                                    duplicateOf: duplicateReport(
                                      c.reports.filter((a) => a.id !== r.id),
                                      x.title,
                                      x.detail,
                                    ),
                                  }
                                : x,
                            ),
                          }))
                        }
                      >
                        Mark intake reviewed <Icon name="check" />
                      </Button>
                    </div>
                  )}
                  <small>
                    {r.externalConsent
                      ? "Reporter permitted external AI processing."
                      : "Kept out of external AI research."}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className="civic-empty">
              <h2>No submissions yet.</h2>
              <p>
                Use the resident space to submit a real concern. No sample
                complaints are counted as resident evidence.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="resident-layout">
          <form
            className="resident-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {receipt ? (
              <div className="report-receipt" role="status">
                <span className="receipt-check">
                  <Icon name="check" size={30} />
                </span>
                <h2>Your perspective is recorded.</h2>
                <p>
                  Saved on this device. It will be included in local intake and
                  screened before research. This preview has not delivered it to
                  an official municipal service.
                </p>
                <code>Reference {receipt.slice(0, 8).toUpperCase()}</code>
                <div className="actions">
                  <Button type="button" onClick={() => setReceipt("")}>
                    Add another perspective <Icon name="plus" />
                  </Button>
                  <Link className="quiet-link" to={`/community/${id}`}>
                    See the municipal view <Icon size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="report-kind">
                  <button
                    type="button"
                    aria-pressed={kind === "complaint"}
                    onClick={() => setKind("complaint")}
                  >
                    Something to improve
                  </button>
                  <button
                    type="button"
                    aria-pressed={kind === "idea"}
                    onClick={() => setKind("idea")}
                  >
                    An idea to explore
                  </button>
                </div>
                <label className="field">
                  What is it about?
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as CivicTopic)}
                  >
                    {Object.entries(topicLabels).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <TextField
                  label="In a few words"
                  value={title}
                  onChange={(v) => setTitle(v.slice(0, 150))}
                  required
                  placeholder="What would you like to change?"
                />
                <TextField
                  label="Tell us a little more"
                  value={detail}
                  onChange={(v) => setDetail(v.slice(0, 2000))}
                  required
                  multiline
                  placeholder="What happens, who is affected, and what might help?"
                />
                <TextField
                  label="Neighbourhood or public place (optional)"
                  value={area}
                  onChange={setArea}
                  placeholder="A general area — no home addresses"
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    Allow this report’s text to be sent to OpenAI for municipal
                    research if an advisor starts a live AI run. Optional; local
                    processing works without this.
                  </span>
                </label>
                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}
                <Button type="submit">
                  Share my perspective <Icon />
                </Button>
                <p className="micro">
                  Please leave out names, contact details and sensitive personal
                  information.
                </p>
              </>
            )}
          </form>
          <aside className="resident-explainer">
            <span className="eyebrow">WHAT HAPPENS NEXT</span>
            {[
              [
                "01",
                "The Listener organises",
                "Your chosen topic helps group concerns. Duplicates and entries needing intake review are kept separate.",
              ],
              [
                "02",
                "The agents investigate",
                "Local needs meet public city evidence. Any external AI run uses only reports with permission.",
              ],
              [
                "03",
                "An advisor decides",
                "An idea needs evidence and local feasibility checks before it reaches the decision queue.",
              ],
            ].map(([n, t, d]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
            <p className="resident-boundary">
              Independent hackathon preview. Not an emergency reporting channel
              or an official {profile.name} complaints service. Submissions
              remain in this browser.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
