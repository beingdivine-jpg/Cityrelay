import { reportJuryEvent } from "./juryTourModel";
import { t as tr, locale } from "./i18n";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "./navigation";
import { examples } from "./data";
import { assessCase } from "./matching";
import { checkpointPlan, exportPlan } from "./planLogic";
import {
  Button,
  CommunityNav,
  EmptyState,
  Icon,
  SelectField,
  Tag,
  TextField,
  useApp,
} from "./components";
import { Missing } from "./Workspace";
import { SourceList } from "./SourceList";
import { liveSummary, useLive } from "./LiveContext";
import type { OutcomeRecord, PilotPlan } from "./model";
import { useShared } from "./SharedContext";
const blankOutcome = (): Omit<
  OutcomeRecord,
  "id" | "planId" | "provenance"
> => ({
  date: new Date().toISOString().slice(0, 10),
  action: "",
  observations: "",
  effort: "",
  obstacles: "",
  lessons: "",
});
export default function Plan() {
  const { id } = useParams();
  const { state, update, notify } = useApp();
  const shared = useShared();
  const live = useLive();
  const [observation, setObservation] = useState(blankOutcome);
  const [editing, setEditing] = useState<string | null>(null);
  const [manualCopy, setManualCopy] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [page, setPage] = useState("intent");
  const turnPage = (next: string) => {
    setPage(next);
    requestAnimationFrame(() => {
      const heading = document.getElementById("notebook-page-title");
      heading?.focus({
        preventScroll: true,
      });
      document.getElementById("pilot-notebook")?.scrollIntoView({
        block: "start",
        behavior: "instant",
      });
    });
  };
  const profile = state.profiles.find((p) => p.id === id);
  const plan = state.plans.find((p) => p.communityId === id);
  if (!profile) return <Missing />;
  if (!plan)
    return (
      <div className="wrap workspace">
        <CommunityNav profile={profile} />
        <EmptyState title={tr("A good idea is only the beginning.")}>
          <p>
            {tr(
              "Explore a connection, inspect its requirements and add it here to shape a small local pilot.",
            )}
          </p>
          <Button to={`/community/${id}/matches`}>
            {tr("Find an approach ")}
            <Icon />
          </Button>
        </EmptyState>
      </div>
    );
  const patch = (change: Partial<PilotPlan>) =>
    update((s) => ({
      ...s,
      plans: s.plans.map((p) =>
        p.id === plan.id
          ? {
              ...p,
              ...change,
            }
          : p,
      ),
    }));
  const checkpoint = () =>
    update((s) => ({
      ...s,
      plans: s.plans.map((p) => (p.id === plan.id ? checkpointPlan(p) : p)),
    }));
  const matches = examples
    .filter((e) => plan.selectedExamples.includes(e.id))
    .map((e) => assessCase(profile, e, state.civic?.[id!]));
  const observations = state.outcomes.filter((o) => o.planId === plan.id);
  const exportText = () => exportPlan(profile, plan, state);
  const downloadPdf = async () => {
    setExporting(true);
    setExportError("");
    try {
      const { downloadPilotPdf } = await import("./pilotPdf");
      await downloadPilotPdf(exportText(), profile.name);
      notify("Pilot PDF prepared. Check your browser downloads.");
      if (id === "krakow-demo") reportJuryEvent({ action: "downloaded" });
    } catch {
      setExportError(
        "The PDF could not be prepared. Try again or download the text version.",
      );
    } finally {
      setExporting(false);
    }
  };
  const copy = async () => {
    const text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      notify("Plan copied to clipboard.");
    } catch {
      const input = document.createElement("textarea");
      input.value = text;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.append(input);
      input.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        /* Offer manual copying below. */
      }
      input.remove();
      if (copied) notify("Plan copied to clipboard.");
      else {
        setManualCopy(text);
        notify("Clipboard unavailable. Select and copy the plan below.");
      }
    }
  };
  const saveObservation = () => {
    const record: OutcomeRecord = {
      ...observation,
      id: editing || crypto.randomUUID(),
      planId: plan.id,
      provenance: "User-reported observation — unverified",
    };
    const now = new Date().toISOString();
    update((s) => ({
      ...s,
      outcomes: editing
        ? s.outcomes.map((o) => (o.id === editing ? record : o))
        : [...s.outcomes, record],
      events: editing
        ? s.events.map((e) =>
            e.id === `observation-${editing}`
              ? {
                  ...e,
                  timestamp: now,
                }
              : e,
          )
        : [
            ...s.events,
            {
              id: `observation-${record.id}`,
              communityId: profile.id,
              kind: "observation",
              source: "User-reported observation — unverified",
              timestamp: now,
              validUntil: "2099-12-31T23:59:59.000Z",
              changedFields: ["local observations"],
              simulation: false,
            },
          ],
    }));
    setObservation(blankOutcome());
    setEditing(null);
    notify(
      editing
        ? "Local observation revised."
        : "Local observation saved. A learning event was added to your workspace.",
    );
  };
  const remove = (record: OutcomeRecord) => {
    update((s) => ({
      ...s,
      outcomes: s.outcomes.filter((o) => o.id !== record.id),
      events: s.events.filter((e) => e.id !== `observation-${record.id}`),
    }));
    if (editing === record.id) {
      setEditing(null);
      setObservation(blankOutcome());
    }
    notify("Local observation removed.");
  };
  return (
    <div className="wrap chapter-page pilot-story">
      <CommunityNav profile={profile} />
      <details className="pilot-history">
        <summary>{tr("Draft history & recovery")}</summary>
        <p>
          {tr(
            "Save a checkpoint before major edits. Restoring keeps a copy of your current text.",
          )}
        </p>
        <Button secondary onClick={checkpoint}>
          {tr("Save checkpoint")}
        </Button>
        {(plan.revisions || []).map((version, i) => (
          <div key={version.at + String(i)}>
            <span>{new Date(version.at).toLocaleString(locale())}</span>
            <button
              onClick={() =>
                update((s) => ({
                  ...s,
                  plans: s.plans.map((p) =>
                    p.id === plan.id
                      ? {
                          ...checkpointPlan(p),
                          ...(version.snapshot || {
                            proposal: version.proposal,
                            goal: version.goal,
                          }),
                        }
                      : p,
                  ),
                }))
              }
            >
              {tr("Restore this version")}
            </button>
          </div>
        ))}
      </details>

      <header className="pilot-story-heading">
        <div>
          <span className="field-kicker">
            {tr("YOUR PILOT / FROM POSSIBILITY TO PRACTICE")}
          </span>
          <h1>
            {tr("A plan for your place.")}
            <br />
            <em>{tr("A next step that’s yours.")}</em>
          </h1>
          <p>
            {tr("A proposed local pilot for ")}
            {profile.name}
            {tr(
              ", informed by documented projects. Site, resources and approvals still need local review.",
            )}
          </p>
        </div>
        <div className="pilot-cover-mark" aria-hidden="true">
          <Icon name="book" size={35} />
          <span>{profile.name}</span>
          <small>{tr("WORKING PILOT BRIEF")}</small>
        </div>
      </header>
      <div className="notebook-tools">
        <span>
          <Icon name="check" size={15} />
          {tr(
            shared.workspace
              ? "Use Save shared changes to publish your edits to the team."
              : " Edits are stored on this device",
          )}
        </span>
        <div className="export-actions">
          <Button
            data-tour="export"
            disabled={exporting}
            onClick={() => void downloadPdf()}
          >
            <Icon name="download" size={17} />
            {tr(exporting ? "Preparing PDF…" : "Download pilot · PDF")}
          </Button>
          <Button secondary onClick={() => void copy()}>
            <Icon name="copy" size={17} />
            {tr(" Copy plan")}
          </Button>
          <a
            className="button secondary"
            href={`data:text/markdown;charset=utf-8,${encodeURIComponent(exportText())}`}
            download={`elsewhere-${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "community"}-plan.md`}
            onClick={() =>
              notify("Markdown export prepared. Check your browser downloads.")
            }
          >
            <Icon name="download" size={17} />
            {tr("Text version · .md")}
          </a>
        </div>
      </div>
      {exportError && (
        <p className="form-error" role="alert">
          {tr(exportError)}
        </p>
      )}
      <p className="pilot-export-note">
        {tr(
          "Download the complete brief, including your edits, evidence, sources and unresolved checks. Prepared on your device.",
        )}
      </p>
      {tr(
        manualCopy && (
          <TextField
            label={tr("Plan text — select and copy")}
            value={manualCopy}
            onChange={setManualCopy}
            multiline
          />
        ),
      )}
      <div className="plan-layout" id="pilot-notebook">
        <article className="plan-document">
          <div className="document-top">
            <Icon name="book" />
            <span>
              {tr("PROPOSAL / ")}
              {tr(profile.name.toUpperCase())}
            </span>
            <Tag>{plan.reviewStatus}</Tag>
          </div>
          <nav
            className="paper-tabs notebook-tabs"
            aria-label={tr("Pilot brief sections")}
          >
            {tr(
              [
                ["intent", "Purpose"],
                ["delivery", "Delivery"],
                ["learning", "Learning"],
              ].map(([key, label], i) => (
                <button
                  key={key}
                  aria-pressed={page === key}
                  aria-controls="notebook-current-page"
                  onClick={() => turnPage(key)}
                >
                  <span>
                    {tr("0")}
                    {tr(i + 1)}
                  </span>
                  {tr(label)}
                </button>
              )),
            )}
          </nav>
          <div
            id="notebook-current-page"
            className="panel-transition"
            key={page}
          >
            {tr(
              page === "intent" && (
                <section className="plan-section">
                  <span className="field-kicker">{tr("01 / PURPOSE")}</span>
                  <h2 id="notebook-page-title" tabIndex={-1}>
                    {tr("Start with a clear purpose.")}
                  </h2>
                  <div className="selected-approaches">
                    {plan.selectedExamples.map((exampleId) => {
                      const ex = examples.find((e) => e.id === exampleId);
                      return ex ? (
                        <div key={ex.id}>
                          <span>
                            <Link to={`/community/${id}/matches/${ex.id}`}>
                              {tr(ex.title)} <span>{tr("↗")}</span>
                            </Link>
                            <small>
                              {tr(ex.origin.name)}
                              {tr(" · ")}
                              {tr(ex.origin.setting)}
                              {tr(" · Documented project")}
                            </small>
                          </span>
                          {plan.selectedExamples.length > 1 && (
                            <button
                              className="icon-button"
                              aria-label={tr(`Remove ${ex.title} from plan`)}
                              onClick={() =>
                                patch({
                                  selectedExamples:
                                    plan.selectedExamples.filter(
                                      (x) => x !== ex.id,
                                    ),
                                })
                              }
                            >
                              <Icon name="close" size={16} />
                            </button>
                          )}
                        </div>
                      ) : null;
                    })}
                  </div>
                  <Link className="text-link" to={`/community/${id}/matches`}>
                    {tr("Select or add another approach ")}
                    <Icon name="plus" size={16} />
                  </Link>
                  {plan.contextSnapshot && (
                    <details className="plan-context-snapshot">
                      <summary>
                        {tr("Weather context saved with this draft")}
                      </summary>
                      <p>{plan.contextSnapshot}</p>
                      <button
                        className="text-link"
                        disabled={!live.observation.data && !live.forecast.data}
                        onClick={() => {
                          patch({
                            contextSnapshot: liveSummary(live),
                          });
                          notify(
                            "Weather snapshot updated with the latest loaded data.",
                          );
                        }}
                      >
                        {tr("Update weather snapshot ")}
                        <span aria-hidden="true">{tr("↻")}</span>
                      </button>
                    </details>
                  )}
                  <TextField
                    label={tr("Locally proposed outcome / pilot goal")}
                    value={plan.goal}
                    onChange={(goal) =>
                      patch({
                        goal,
                      })
                    }
                    multiline
                  />
                  <TextField
                    label={tr("Our pilot proposal")}
                    value={plan.proposal}
                    onChange={(proposal) =>
                      patch({
                        proposal,
                      })
                    }
                    multiline
                  />
                </section>
              ),
            )}
            {tr(
              page === "delivery" && (
                <section className="plan-section">
                  <span className="field-kicker">{tr("02 / DELIVERY")}</span>
                  <h2 id="notebook-page-title" tabIndex={-1}>
                    {tr("Make it yours.")}
                  </h2>
                  <p>
                    {tr("Keep the useful parts. Change what your place needs.")}
                  </p>
                  <TextField
                    label={tr("Retained initiatives and assets")}
                    value={plan.retainedInitiatives}
                    onChange={(retainedInitiatives) =>
                      patch({
                        retainedInitiatives,
                      })
                    }
                    multiline
                  />
                  <TextField
                    label={tr("Local adaptations")}
                    value={plan.adaptations}
                    onChange={(adaptations) =>
                      patch({
                        adaptations,
                      })
                    }
                    multiline
                  />
                  <TextField
                    label={tr("Prerequisites and checks to arrange")}
                    value={plan.prerequisites}
                    onChange={(prerequisites) =>
                      patch({
                        prerequisites,
                      })
                    }
                    multiline
                  />
                  <TextField
                    label={tr("Local role assignments")}
                    value={plan.roleAssignments}
                    onChange={(roleAssignments) =>
                      patch({
                        roleAssignments,
                      })
                    }
                    multiline
                    hint="Use role labels; no personal contact details are needed."
                  />
                  <TextField
                    label={tr("Pilot timeline")}
                    value={plan.schedule}
                    onChange={(schedule) =>
                      patch({
                        schedule,
                      })
                    }
                    multiline
                  />
                </section>
              ),
            )}
            {tr(
              page === "learning" && (
                <>
                  <section className="plan-section">
                    <span className="field-kicker">{tr("03 / LEARNING")}</span>
                    <h2 id="notebook-page-title" tabIndex={-1}>
                      {tr("What will you learn?")}
                    </h2>
                    <fieldset className="metric-options">
                      <legend>{tr("What the pilot will measure")}</legend>
                      {tr(
                        [
                          "Participation",
                          "Access barriers",
                          "Staff and volunteer effort",
                          "Travel time and effort",
                          "Opening hours delivered",
                          "Resident feedback",
                          "Maintenance needs",
                        ].map((metric) => (
                          <label className="checkbox-label" key={metric}>
                            <input
                              type="checkbox"
                              checked={plan.metrics.includes(metric)}
                              onChange={(e) =>
                                patch({
                                  metrics: e.target.checked
                                    ? [...plan.metrics, metric]
                                    : plan.metrics.filter((m) => m !== metric),
                                })
                              }
                            />
                            {tr(metric)}
                          </label>
                        )),
                      )}
                    </fieldset>
                    <SelectField
                      label={tr("Review status")}
                      value={plan.reviewStatus}
                      onChange={(reviewStatus) =>
                        patch({
                          reviewStatus:
                            reviewStatus as PilotPlan["reviewStatus"],
                        })
                      }
                      options={{
                        Draft: "Draft",
                        "Ready for local review": "Ready for local review",
                      }}
                      hint="This label does not verify readiness or approve real-world delivery."
                    />
                    <div className="source-results">
                      <strong>
                        {tr(
                          "Documented results and local proposals are different",
                        )}
                      </strong>
                      <p>
                        {tr(
                          "The project facts below belong to their source cities. Your intended local outcome is a proposal; no impact is predicted.",
                        )}
                      </p>
                      {plan.selectedExamples.map((exampleId) => {
                        const ex = examples.find((e) => e.id === exampleId);
                        return ex ? (
                          <div key={ex.id}>
                            <h3>
                              {tr(ex.origin.name)}
                              {tr(": ")}
                              {tr(ex.shortTitle)}
                            </h3>
                            {tr(
                              ex.reportedOutcomes.map((r) => (
                                <p key={r}>{tr(r)}</p>
                              )),
                            )}
                            <SourceList ids={ex.sources} compact />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </section>
                  <details className="learning-record">
                    <summary>
                      <span>
                        {tr("After you try it: record what happened")}
                      </span>
                      <span>
                        {tr(observations.length)}
                        {tr(" local records")}
                        {tr(" ")}
                        <Icon name="plus" size={17} />
                      </span>
                    </summary>
                    <section className="outcome-section" id="observations">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">
                            {tr("AFTER YOUR PILOT / CLOSE THE LOOP")}
                          </span>
                          <h2>{tr("What happened when you tried?")}</h2>
                        </div>
                        <Tag>{tr("User-reported · unverified")}</Tag>
                      </div>
                      <p className="outcome-intro">
                        {tr(
                          "Record only what you actually observed. Entries remain user-reported and are not independently verified.",
                        )}
                      </p>
                      <form
                        className="outcome-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveObservation();
                        }}
                      >
                        <div className="form-grid">
                          <TextField
                            label={tr("Attempted action")}
                            value={observation.action}
                            onChange={(action) =>
                              setObservation({
                                ...observation,
                                action,
                              })
                            }
                            multiline
                            required
                          />
                          <TextField
                            label={tr("Observed result")}
                            value={observation.observations}
                            onChange={(observations) =>
                              setObservation({
                                ...observation,
                                observations,
                              })
                            }
                            multiline
                            required
                          />
                          <TextField
                            label={tr("Effort involved")}
                            value={observation.effort}
                            onChange={(effort) =>
                              setObservation({
                                ...observation,
                                effort,
                              })
                            }
                            placeholder={tr("Time, resources or coordination")}
                          />
                          <TextField
                            label={tr("Obstacles encountered")}
                            value={observation.obstacles}
                            onChange={(obstacles) =>
                              setObservation({
                                ...observation,
                                obstacles,
                              })
                            }
                          />
                        </div>
                        <TextField
                          label={tr("Lessons for next time")}
                          value={observation.lessons}
                          onChange={(lessons) =>
                            setObservation({
                              ...observation,
                              lessons,
                            })
                          }
                          multiline
                        />
                        <label className="date-field">
                          {tr("Observation date")}
                          <input
                            type="date"
                            value={observation.date}
                            required
                            onChange={(e) =>
                              setObservation({
                                ...observation,
                                date: e.target.value,
                              })
                            }
                          />
                        </label>
                        <div className="actions">
                          <Button type="submit">
                            {tr(
                              editing
                                ? "Save revision"
                                : "Save local observation",
                            )}
                            {tr(" ")}
                            <Icon name="check" />
                          </Button>
                          {tr(
                            editing && (
                              <Button
                                secondary
                                onClick={() => {
                                  setEditing(null);
                                  setObservation(blankOutcome());
                                }}
                              >
                                {tr("Cancel revision")}
                              </Button>
                            ),
                          )}
                        </div>
                      </form>
                      {tr(
                        observations.length > 0 && (
                          <div className="observations">
                            <h3>{tr("Our local learning record")}</h3>
                            {tr(
                              observations.map((o) => (
                                <article className="observation" key={o.id}>
                                  <div className="observation-heading">
                                    <strong>{tr(o.action)}</strong>
                                    <span>
                                      {tr(o.date)}
                                      {tr(" · User-reported · unverified")}
                                    </span>
                                  </div>
                                  <p>{tr(o.observations)}</p>
                                  <dl>
                                    <div>
                                      <dt>{tr("Effort")}</dt>
                                      <dd>{tr(o.effort || "Not recorded")}</dd>
                                    </div>
                                    <div>
                                      <dt>{tr("Obstacles")}</dt>
                                      <dd>
                                        {tr(o.obstacles || "Not recorded")}
                                      </dd>
                                    </div>
                                    <div>
                                      <dt>{tr("Lessons")}</dt>
                                      <dd>{tr(o.lessons || "Not recorded")}</dd>
                                    </div>
                                  </dl>
                                  <div className="actions">
                                    <button
                                      className="text-link"
                                      onClick={() => {
                                        setEditing(o.id);
                                        setObservation({
                                          date: o.date,
                                          action: o.action,
                                          observations: o.observations,
                                          effort: o.effort,
                                          obstacles: o.obstacles,
                                          lessons: o.lessons,
                                        });
                                        document
                                          .querySelector(".outcome-form")
                                          ?.scrollIntoView({
                                            block: "center",
                                          });
                                      }}
                                    >
                                      {tr("Revise record ")}
                                      <Icon name="edit" size={16} />
                                    </button>
                                    <button
                                      className="text-link"
                                      onClick={() => remove(o)}
                                    >
                                      {tr("Remove record ")}
                                      <Icon name="close" size={16} />
                                    </button>
                                  </div>
                                </article>
                              )),
                            )}
                          </div>
                        ),
                      )}
                    </section>
                  </details>
                </>
              ),
            )}
          </div>
          <div className="notebook-pagination">
            <span>
              {tr(
                page === "intent"
                  ? "A clear purpose is enough to start."
                  : page === "delivery"
                    ? "Small enough to try. Specific enough to learn."
                    : "Your next step: review the pilot with your local team.",
              )}
            </span>
            {tr(
              page === "intent" ? (
                <Button onClick={() => turnPage("delivery")}>
                  {tr("Next: make it local ")}
                  <Icon />
                </Button>
              ) : page === "delivery" ? (
                <Button onClick={() => turnPage("learning")}>
                  {tr("Next: define learning ")}
                  <Icon />
                </Button>
              ) : (
                <Button onClick={() => void copy()}>
                  {tr("Copy your pilot ")}
                  <Icon name="copy" />
                </Button>
              ),
            )}
          </div>
        </article>
        <aside className="plan-sidebar">
          <div className="plan-margin-note">
            <span className="eyebrow">{tr("Before the first step")}</span>
            <h3>
              {tr("Keep the unknowns")}
              <br />
              {tr("in view.")}
            </h3>
            {plan.selectedExamples.map((exampleId) => {
              const a = matches.find((m) => m.example.id === exampleId);
              const ex = examples.find((e) => e.id === exampleId);
              return (
                <div key={exampleId} className="prerequisite-note">
                  <strong>{tr(ex?.title)}</strong>
                  {tr(
                    a ? (
                      a.readiness.filter((c) => c.state !== "met").length ? (
                        a.readiness
                          .filter((c) => c.state !== "met")
                          .map((c) => (
                            <p key={c.key}>
                              <Tag
                                kind={
                                  c.state === "unknown" ? "unknown" : "blocked"
                                }
                              >
                                {tr(c.state)}
                              </Tag>
                              {tr(c.label)}
                            </p>
                          ))
                      ) : (
                        <p>
                          {tr(
                            "Listed checks met. Confirm operating details and local suitability before proceeding.",
                          )}
                        </p>
                      )
                    ) : (
                      <p>
                        {tr(
                          "This approach no longer matches your priority or outcome. Reassess it.",
                        )}
                      </p>
                    ),
                  )}
                </div>
              );
            })}
            <p className="micro">
              {tr(
                "Recomputed from your current profile. Editing the working document does not change readiness.",
              )}
            </p>
            <Link className="text-link" to={`/community/${id}/brief`}>
              {tr("Review local constraints ")}
              <Icon size={16} />
            </Link>
          </div>
          <div className="local-save-note">
            <Icon name="check" size={18} />
            <p>
              {tr(
                shared.workspace
                  ? "Use Save shared changes to publish your edits to the team."
                  : "Changes save in this browser. Download a copy to keep or share.",
              )}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
