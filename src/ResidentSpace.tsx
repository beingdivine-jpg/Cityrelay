import { t as tr, locale } from "./i18n";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "./navigation";
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
  if (!profile || !civic)
    return intake ? (
      <Missing />
    ) : (
      <div className="page-width safety-page">
        <h1>{tr("This local reporting link belongs to another browser.")}</h1>
        <p>
          {tr(
            "No report has been sent. Ask the team for its shared resident reporting link, or explore the Kraków example.",
          )}
        </p>
        <Button to="/enter">{tr("Explore the example")}</Button>
      </div>
    );
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
      status: needsReview(title + " " + detail + " " + area)
        ? "needs-review"
        : "received",
      duplicateOf: duplicateReport(
        civic!.reports,
        title,
        detail,
        area,
        kind,
        topic,
      ),
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
      {tr(
        intake ? (
          <CommunityNav profile={profile} />
        ) : (
          <Link className="quiet-link" to="/enter">
            <Icon name="back" size={15} />
            {tr(" Municipal workspace")}
          </Link>
        ),
      )}
      {!intake && (
        <div className="delivery-notice">
          <strong>{tr("Practice report — not sent to a municipality")}</strong>
          <p>
            {tr(
              "This local preview stores your report only in this browser. Do not use it for urgent issues or official requests.",
            )}
          </p>
        </div>
      )}
      <div className="civic-heading">
        <div>
          <span className="eyebrow">
            {tr(intake ? "RESIDENT INTAKE" : "A PLACE FOR YOUR PERSPECTIVE")}
            {tr(" /")}
            {tr(" ")}
            {tr(profile.name.toUpperCase())}
          </span>
          <h1>
            {tr(
              intake ? (
                <>
                  {tr("Listen before")}
                  <br />
                  <span className="blue-text">{tr("you decide.")}</span>
                </>
              ) : (
                <>
                  {tr("A better city")}
                  <br />
                  <span className="blue-text">{tr("starts with you.")}</span>
                </>
              ),
            )}
          </h1>
        </div>
        <p>
          {tr(
            intake
              ? "Every concern and idea stays visible. Exact duplicates do not inflate demand; ideas with unresolved conditions stay out of the decision queue."
              : "Tell us what could work better, or share an idea worth trying. Your experience gives municipal research a local starting point.",
          )}
        </p>
      </div>
      {tr(
        intake ? (
          <>
            <div className="intake-toolbar">
              <span>
                {tr(civic.reports.length)}
                {tr(" submissions on this device")}
              </span>
              <Button to={`/report/${id}`}>
                {tr("Open resident space ")}
                <Icon />
              </Button>
            </div>
            {tr(
              civic.reports.length ? (
                <div className="intake-list">
                  {tr(
                    civic.reports.map((r) => (
                      <article key={r.id}>
                        <div className="intake-meta">
                          <span className="eyebrow">
                            {tr(r.kind === "idea" ? "IDEA" : "CONCERN")}
                            {tr(" /")}
                            {tr(" ")}
                            {tr(topicLabels[r.topic])}
                          </span>
                          <span>
                            {tr(
                              new Date(r.submittedAt).toLocaleDateString(
                                locale(),
                              ),
                            )}
                          </span>
                        </div>
                        <h3>
                          {r.provenance === "demo" ? tr(r.title) : r.title}
                        </h3>
                        <p>
                          {r.provenance === "demo" ? tr(r.detail) : r.detail}
                        </p>
                        <div className="intake-meta">
                          <span>
                            {tr(r.area || "No neighbourhood specified")}
                            {tr(" · Unverified submission")}
                          </span>
                          <span className="tag">
                            {tr(
                              r.duplicateOf
                                ? "Exact duplicate"
                                : r.status === "needs-review"
                                  ? "Intake review needed"
                                  : "Eligible for analysis",
                            )}
                          </span>
                        </div>
                        {tr(
                          r.status === "needs-review" && (
                            <div className="intake-review">
                              <p>
                                {tr(
                                  "May contain contact details or insufficient context. Correct the entry before including it in analysis.",
                                )}
                              </p>
                              <TextField
                                label={tr("Revise title")}
                                value={r.title}
                                onChange={(value) =>
                                  change((c) => ({
                                    ...c,
                                    reports: c.reports.map((x) =>
                                      x.id === r.id
                                        ? {
                                            ...x,
                                            title: value.slice(0, 150),
                                          }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                              <textarea
                                aria-label={tr(`Revise report ${r.title}`)}
                                value={r.detail}
                                onChange={(e) =>
                                  change((c) => ({
                                    ...c,
                                    reports: c.reports.map((x) =>
                                      x.id === r.id
                                        ? {
                                            ...x,
                                            detail: e.target.value,
                                          }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                              <TextField
                                label={tr("Neighbourhood or area")}
                                value={r.area}
                                onChange={(value) =>
                                  change((c) => ({
                                    ...c,
                                    reports: c.reports.map((x) =>
                                      x.id === r.id
                                        ? { ...x, area: value.slice(0, 100) }
                                        : x,
                                    ),
                                  }))
                                }
                              />
                              <Button
                                secondary
                                disabled={
                                  r.title.trim().length < 5 ||
                                  r.detail.trim().length < 20 ||
                                  needsReview(
                                    r.title + " " + r.detail + " " + r.area,
                                  )
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
                                              c.reports.filter(
                                                (a) => a.id !== r.id,
                                              ),
                                              x.title,
                                              x.detail,
                                              x.area,
                                              x.kind,
                                              x.topic,
                                            ),
                                          }
                                        : x,
                                    ),
                                  }))
                                }
                              >
                                {tr("Mark intake reviewed ")}
                                <Icon name="check" />
                              </Button>
                            </div>
                          ),
                        )}
                        <small>
                          {tr(
                            r.externalConsent
                              ? "Reporter permitted external AI processing."
                              : "Kept out of external AI research.",
                          )}
                        </small>
                      </article>
                    )),
                  )}
                </div>
              ) : (
                <div className="civic-empty">
                  <h2>{tr("No submissions yet.")}</h2>
                  <p>
                    {tr(
                      "Use the resident space to submit a real concern. No sample complaints are counted as resident evidence.",
                    )}
                  </p>
                </div>
              ),
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
              {tr(
                receipt ? (
                  <div className="report-receipt" role="status">
                    <span className="receipt-check">
                      <Icon name="check" size={30} />
                    </span>
                    <h2>{tr("Your perspective is recorded.")}</h2>
                    <p>
                      {tr(
                        "Saved on this device. It will be included in local intake and screened before research. This preview has not delivered it to an official municipal service.",
                      )}
                    </p>
                    <code>
                      {tr("Reference ")}
                      {tr(receipt.slice(0, 8).toUpperCase())}
                    </code>
                    <div className="actions">
                      <Button type="button" onClick={() => setReceipt("")}>
                        {tr("Add another perspective ")}
                        <Icon name="plus" />
                      </Button>
                      <Link className="quiet-link" to="/enter">
                        {tr("Return to the demo overview ")}
                        <Icon size={16} />
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
                        {tr("Something to improve")}
                      </button>
                      <button
                        type="button"
                        aria-pressed={kind === "idea"}
                        onClick={() => setKind("idea")}
                      >
                        {tr("An idea to explore")}
                      </button>
                    </div>
                    <label className="field">
                      {tr("What is it about?")}
                      <select
                        value={topic}
                        onChange={(e) => setTopic(e.target.value as CivicTopic)}
                      >
                        {tr(
                          Object.entries(topicLabels).map(([k, v]) => (
                            <option key={k} value={k}>
                              {tr(v)}
                            </option>
                          )),
                        )}
                      </select>
                    </label>
                    <TextField
                      label={tr("In a few words")}
                      value={title}
                      error={
                        error && title.trim().length < 5
                          ? tr("Use at least 5 characters.")
                          : undefined
                      }
                      onChange={(v) => setTitle(v.slice(0, 150))}
                      required
                      placeholder={tr("What would you like to change?")}
                    />
                    <TextField
                      label={tr("Tell us a little more")}
                      value={detail}
                      error={
                        error && detail.trim().length < 20
                          ? tr("Use at least 20 characters.")
                          : undefined
                      }
                      onChange={(v) => setDetail(v.slice(0, 2000))}
                      required
                      multiline
                      placeholder={tr(
                        "What happens, who is affected, and what might help?",
                      )}
                    />
                    <TextField
                      label={tr("Neighbourhood or public place (optional)")}
                      value={area}
                      onChange={setArea}
                      placeholder={tr("A general area — no home addresses")}
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                      />
                      <span>
                        {tr(
                          "Allow this report’s text to be sent to OpenAI for municipal research if an advisor starts a live AI run. Optional; local processing works without this.",
                        )}
                      </span>
                    </label>
                    {tr(
                      error && (
                        <p role="alert" className="form-error">
                          {tr(error)}
                        </p>
                      ),
                    )}
                    <Button type="submit">
                      {tr("Share my perspective ")}
                      <Icon />
                    </Button>
                    <p className="micro">
                      {tr(
                        "Please leave out names, contact details and sensitive personal information.",
                      )}
                    </p>
                  </>
                ),
              )}
            </form>
            <aside className="resident-explainer">
              <span className="eyebrow">{tr("WHAT HAPPENS NEXT")}</span>
              {tr(
                [
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
                    <span>{tr(n)}</span>
                    <h3>{tr(t)}</h3>
                    <p>{tr(d)}</p>
                  </div>
                )),
              )}
              <p className="resident-boundary">
                {tr(
                  "Independent hackathon preview. Not an emergency reporting channel or an official ",
                )}
                {profile.name}
                {tr(" complaints service. Submissions remain in this browser.")}
              </p>
            </aside>
          </div>
        ),
      )}
    </div>
  );
}
