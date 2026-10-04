import { reportJuryEvent } from "./juryTourModel";
import { withDemoReality, sampleBudget } from "./demoReality";
import { t as tr, useLanguage } from "./i18n";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Link, useNavigate } from "./navigation";
import { examples, localSuggestion } from "./data";
import { assessCase } from "./matching";
import { calculateFitScore } from "./fitScore";
import FitScorecard from "./FitScorecard";
import { SourceList } from "./SourceList";
import { getSource } from "./sources";
import { liveSummary, useLive } from "./LiveContext";
import { addPlanExample, createPlan, localizeDemoPlan } from "./planLogic";
import {
  Button,
  CommunityNav,
  Icon,
  Readiness,
  Status,
  TextField,
  useApp,
} from "./components";
import { Constraints, Missing } from "./Workspace";
import ProjectArt from "./ProjectArt";
import EvidenceChecklist from "./EvidenceChecklist";
import { projectPresentation } from "./projectPresentation";
export default function MatchDetail() {
  const language = useLanguage();
  const [proposalEdited, setProposalEdited] = useState(false);
  const { id, matchId } = useParams();
  const location = useLocation();
  const { state, update, notify, saveProfile } = useApp();
  const live = useLive();
  const navigate = useNavigate();
  const [panel, setPanel] = useState("understand");
  const profile = state.profiles.find((p) => p.id === id),
    example = examples.find((e) => e.id === matchId);
  const savedPlan = state.plans.find((p) => p.communityId === id);
  const existing =
    profile && savedPlan ? localizeDemoPlan(profile, savedPlan) : savedPlan;
  const [proposal, setProposal] = useState(
    existing?.selectedExamples.includes(matchId || "")
      ? existing.proposal
      : profile && example
        ? tr(localSuggestion(profile, example, "proposal"))
        : "",
  );
  useEffect(() => {
    setPanel(location.hash === "#peer-draft" ? "fit" : "understand");
    setProposalEdited(false);
    setProposal(
      existing?.selectedExamples.includes(matchId || "")
        ? existing.proposal
        : profile && example
          ? tr(localSuggestion(profile, example, "proposal"))
          : "",
    );
  }, [id, matchId]);
  useEffect(() => {
    if (!proposalEdited && profile && example)
      setProposal(
        existing?.selectedExamples.includes(example.id)
          ? existing.proposal
          : tr(localSuggestion(profile, example, "proposal")),
      );
  }, [language, proposalEdited, profile, example, existing]);
  useEffect(() => {
    if (profile) {
      const prepared = withDemoReality(profile);
      if (prepared !== profile) saveProfile(prepared);
    }
  }, [profile, saveProfile]);
  useEffect(() => {
    if (location.hash === "#tour-fit") setPanel("fit");
    if (location.hash === "#tour-adapt") setPanel("adapt");
  }, [location.hash]);
  const changePanel = (next: string) => {
    setPanel(next);
    if (id === "krakow-demo" && ["fit", "adapt"].includes(next))
      reportJuryEvent({ action: next as "fit" | "adapt" });
  };
  if (!profile || !example) return <Missing />;
  const assessment = assessCase(profile, example, state.civic?.[id!]);
  const draft = state.drafts.find(
    (d) => d.communityId === id && d.exampleId === matchId,
  );
  const meta = projectPresentation[example.id];
  function ask() {
    setPanel("fit");
    if (!draft)
      update((s) => ({
        ...s,
        drafts: [
          ...s.drafts,
          {
            id: crypto.randomUUID(),
            communityId: profile!.id,
            exampleId: example!.id,
            text:
              assessment?.question ||
              "Which local conditions should we investigate first?",
            updatedAt: new Date().toISOString(),
          },
        ],
      }));
    requestAnimationFrame(() =>
      document.getElementById("peer-draft")?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      }),
    );
  }
  function add() {
    update((s) => {
      const prior = s.plans.find((p) => p.communityId === id);
      return {
        ...s,
        plans: prior
          ? s.plans.map((p) =>
              p.id === prior.id ? addPlanExample(p, example!.id) : p,
            )
          : [
              ...s.plans,
              {
                ...createPlan(
                  profile!,
                  example!,
                  id === "krakow" ? liveSummary(live) : undefined,
                ),
                proposal,
                researchRunId: s.civic?.[id!]?.runs.find(
                  (r) => r.status === "complete",
                )?.id,
                decisionNote: s.civic?.[id!]?.decisions[example!.id]?.note,
              },
            ],
      };
    });
    notify("Your pilot brief is ready to shape.");
    navigate(`/community/${id}/plan`);
  }
  return (
    <div className="work-page page-width case-page">
      <CommunityNav profile={profile} />
      <Link className="quiet-link case-back" to={`/community/${id}/matches`}>
        <Icon name="back" size={16} />
        {tr(" All relevant ideas")}
      </Link>
      <header className="case-heading">
        <div>
          <span className="eyebrow">
            {tr("LEARN FROM ")}
            {tr(example.origin.name.toUpperCase())}
            {tr(",")}
            {tr(" ")}
            {tr(example.origin.country.toUpperCase())}
          </span>
          <h1>{tr(meta?.headline || example.title)}</h1>
          <p>
            {tr(example.shortTitle)} <span>{tr("→")}</span>
            {tr(" A possibility for ")}
            {profile.name}
          </p>
        </div>
        <div className="case-art-small">
          <ProjectArt id={example.id} />
        </div>
      </header>
      <div className="case-layout">
        <div className="case-main">
          <nav className="case-tabs" aria-label={tr("Explore this idea")}>
            {tr(
              [
                ["understand", "Understand the idea"],
                ["fit", "Check the local fit"],
                ["adapt", "Make it yours"],
              ].map(([key, label], i) => (
                <button
                  key={key}
                  aria-pressed={panel === key}
                  onClick={() => changePanel(key)}
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
          <section
            className="case-panel panel-transition"
            key={panel}
            aria-label={tr(
              panel === "understand"
                ? "Understand the idea"
                : panel === "fit"
                  ? "Check the local fit"
                  : "Make it yours",
            )}
          >
            {tr(
              panel === "understand" && (
                <>
                  <span className="eyebrow">
                    {tr("WHAT HAPPENED ELSEWHERE")}
                  </span>
                  <h2>
                    {tr(example.title)}
                    {tr(".")}
                  </h2>
                  <p className="case-mechanism">{tr(example.mechanism)}</p>
                  <div className="source-fact">
                    <strong>{tr(example.fact.value)}</strong>
                    <div>
                      <span>{tr(example.fact.label)}</span>
                      <small>{tr(example.fact.asOf)}</small>
                      <a
                        href={getSource(example.fact.sourceId)?.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {tr(getSource(example.fact.sourceId)?.publisher)}
                        {tr(" ")}
                        <span>{tr("↗")}</span>
                      </a>
                    </div>
                  </div>
                  <div className="lesson-note">
                    <span>{tr("THE TRANSFERABLE IDEA")}</span>
                    <p>
                      {tr(
                        meta?.lesson ||
                          "Study the mechanism before adapting it.",
                      )}
                    </p>
                  </div>
                  <details className="evidence-details">
                    <summary>
                      {tr("Read the evidence & limitations")}
                      {tr(" ")}
                      <Icon name="plus" size={17} />
                    </summary>
                    {tr(
                      example.reportedOutcomes.map((o) => (
                        <p key={o}>{tr(o)}</p>
                      )),
                    )}
                    <p className="evidence-limit">{tr(example.limitations)}</p>
                    <SourceList ids={example.sources} />
                  </details>
                  <div className="panel-next">
                    <span>
                      {tr("Now, bring your local context into the picture.")}
                    </span>
                    <Button data-tour="fit" onClick={() => changePanel("fit")}>
                      {tr("Check the local fit ")}
                      <Icon />
                    </Button>
                  </div>
                </>
              ),
            )}
            {tr(
              panel === "fit" && (
                <>
                  <span className="eyebrow">
                    {tr("FROM ")}
                    {tr(example.origin.name.toUpperCase())}
                    {tr(" TO")}
                    {tr(" ")}
                    {tr(profile.name.toUpperCase())}
                  </span>
                  <h2>{tr("What would it take here?")}</h2>
                  <p>
                    {tr(
                      "An idea can travel. Its conditions need checking. These are suggested transfer checks, using your current brief.",
                    )}
                  </p>
                  {tr(
                    assessment ? (
                      <>
                        <div className="fit-connection">
                          <span>{tr("WHAT YOU CAN BUILD ON")}</span>
                          <p>{tr(assessment.reasons[0])}</p>
                        </div>
                        {profile.id === "krakow-demo" && (
                          <div className="demo-reality" data-tour="reality">
                            <span className="eyebrow">
                              {tr("PREFILLED / DEMO ASSUMPTIONS")}
                            </span>
                            <h3>
                              {tr("You have enough to rehearse the decision.")}
                            </h3>
                            <p>
                              {tr(
                                profile.localChecks?.[example.id]?.budget
                                  ?.evidence || sampleBudget,
                              )}
                            </p>
                            <small>
                              {tr(
                                "Sample team, schedule and evidence notes are filled in below. You can edit them, or move straight to the proposal. Real costs, permissions and availability remain unverified.",
                              )}
                            </small>
                            <Button onClick={() => changePanel("adapt")}>
                              {tr("Continue with demo assumptions")} <Icon />
                            </Button>
                          </div>
                        )}
                        <Readiness assessment={assessment} />
                        <EvidenceChecklist
                          profile={profile}
                          assessment={assessment}
                        />
                        <Constraints profile={profile} />
                        <div className="peer-question">
                          <div>
                            <span className="eyebrow">
                              {tr("ONE QUESTION CAN MOVE THINGS FORWARD")}
                            </span>
                            <h3>{tr(assessment.question)}</h3>
                          </div>
                          <button className="quiet-link" onClick={ask}>
                            {tr("Draft this question ")}
                            <Icon name="chat" size={18} />
                          </button>
                        </div>
                        <div className="panel-next">
                          <span>
                            {tr("Keep the useful parts. Adapt the rest.")}
                          </span>
                          <Button onClick={() => changePanel("adapt")}>
                            {tr("Shape the local version ")}
                            <Icon />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p>
                        {tr("Your challenge has changed.")}
                        {tr(" ")}
                        <Link to={`/community/${id}/matches`}>
                          {tr("Return to the current ideas.")}
                        </Link>
                      </p>
                    ),
                  )}
                </>
              ),
            )}
            {tr(
              panel === "adapt" && (
                <>
                  <span className="eyebrow">
                    {tr("YOUR LOCAL VERSION / A WORKING PROPOSAL")}
                  </span>
                  <h2>
                    {tr("Make it belong to ")}
                    {profile.name}
                    {tr(".")}
                  </h2>
                  <p>{tr(localSuggestion(profile, example, "adaptation"))}</p>
                  {existing && (
                    <p className="agent-notice">
                      {tr(
                        "Your existing pilot text will be preserved. This adds the project as supporting evidence.",
                      )}
                    </p>
                  )}
                  {existing ? (
                    <div>
                      <p>{proposal}</p>
                      <Link className="quiet-link" to={`/community/${id}/plan`}>
                        {tr("Edit your saved pilot")}
                        <Icon />
                      </Link>
                    </div>
                  ) : (
                    <TextField
                      label={tr("What could you try locally?")}
                      multiline
                      value={proposal}
                      onChange={(value) => {
                        setProposalEdited(true);
                        setProposal(value);
                      }}
                    />
                  )}
                  <p className="field-hint">
                    {tr(
                      "A proposal to investigate. Local resources, permissions and outcomes are still to be established.",
                    )}
                  </p>
                  <div className="panel-next">
                    <span>
                      {tr("Take this into a practical, editable pilot brief.")}
                    </span>
                    <Button
                      data-tour="pilot"
                      onClick={add}
                      disabled={!assessment}
                    >
                      {tr(
                        existing
                          ? "Add evidence to my pilot"
                          : "Create a pilot brief ",
                      )}
                      <Icon />
                    </Button>
                  </div>
                </>
              ),
            )}
          </section>
          {tr(
            draft && (
              <section id="peer-draft" className="peer-draft">
                <span className="eyebrow">
                  {tr("A QUESTION FOR ")}
                  {tr(example.origin.name.toUpperCase())}
                </span>
                <h2>{tr("Ask what the report can’t tell you.")}</h2>
                <TextField
                  label={tr("Your draft question")}
                  value={draft.text}
                  multiline
                  onChange={(text) =>
                    update((s) => ({
                      ...s,
                      drafts: s.drafts.map((d) =>
                        d.id === draft.id
                          ? {
                              ...d,
                              text,
                              updatedAt: new Date().toISOString(),
                            }
                          : d,
                      ),
                    }))
                  }
                />
                <p className="micro">
                  {tr(
                    "Saved locally. No message has been sent. Use the public source to identify the appropriate organisation.",
                  )}
                </p>
                <button
                  className="quiet-link"
                  onClick={() => {
                    update((s) => ({
                      ...s,
                      drafts: s.drafts.filter((d) => d.id !== draft.id),
                    }));
                    notify("Draft question removed.");
                  }}
                >
                  {tr("Remove draft ")}
                  <Icon name="close" size={15} />
                </button>
              </section>
            ),
          )}
        </div>
        <aside className="case-margin">
          <span className="eyebrow">{tr("YOUR LOCAL LENS")}</span>
          <h3>{profile.name}</h3>
          <FitScorecard score={calculateFitScore(assessment)} />
          <p>
            {tr(
              !profile.problems.includes(example.domain)
                ? "Investigating a new topic alongside your current municipal brief. Review the local need before adding this approach to a pilot."
                : profile.goals.objective ||
                    profile.goals.ambition ||
                    "Explore a useful idea for your municipality.",
            )}
          </p>
          {tr(assessment && <Status assessment={assessment} />)}
          <dl>
            <div>
              <dt>{tr("Source evidence")}</dt>
              <dd>{tr("Documented project")}</dd>
            </div>
            <div>
              <dt>{tr("Local feasibility")}</dt>
              <dd>
                {tr(
                  assessment
                    ? `${assessment.readiness.filter((c) => c.state !== "met").length} checks to resolve`
                    : "Reassess your brief",
                )}
              </dd>
            </div>
            <div>
              <dt>{tr("Local outcome")}</dt>
              <dd>{tr("To be tested")}</dd>
            </div>
          </dl>
          <Link className="quiet-link" to={`/community/${id}/brief`}>
            {tr("Revisit your brief ")}
            <Icon size={15} />
          </Link>
          <div className="margin-principle">
            <span>{tr("↗")}</span>
            <p>
              {tr("The best idea is the one")}
              <br />
              {tr("you can make your own.")}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
