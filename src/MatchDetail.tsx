import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { examples, localSuggestion } from "./data";
import { assessMatches } from "./matching";
import { SourceList } from "./SourceList";
import { getSource } from "./sources";
import { liveSummary, useLive } from "./LiveContext";
import { createPlan } from "./planLogic";
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
import { projectPresentation } from "./projectPresentation";
export default function MatchDetail() {
  const { id, matchId } = useParams();
  const location = useLocation();
  const { state, update, notify } = useApp();
  const live = useLive();
  const navigate = useNavigate();
  const [panel, setPanel] = useState("understand");
  const profile = state.profiles.find((p) => p.id === id),
    example = examples.find((e) => e.id === matchId);
  const existing = state.plans.find((p) => p.communityId === id);
  const [proposal, setProposal] = useState(
    existing?.selectedExamples.includes(matchId || "")
      ? existing.proposal
      : profile && example
        ? localSuggestion(profile, example, "proposal")
        : "",
  );
  useEffect(() => {
    setPanel(location.hash === "#peer-draft" ? "fit" : "understand");
    setProposal(
      existing?.selectedExamples.includes(matchId || "")
        ? existing.proposal
        : profile && example
          ? localSuggestion(profile, example, "proposal")
          : "",
    );
  }, [id, matchId]);
  if (!profile || !example) return <Missing />;
  const assessment = assessMatches(profile, examples).find(
    (a) => a.example.id === matchId,
  );
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
              p.id === prior.id
                ? {
                    ...p,
                    selectedExamples: [
                      ...new Set([...p.selectedExamples, example!.id]),
                    ],
                    proposal,
                  }
                : p,
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
        <Icon name="back" size={16} /> All relevant ideas
      </Link>
      <header className="case-heading">
        <div>
          <span className="eyebrow">
            LEARN FROM {example.origin.name.toUpperCase()},{" "}
            {example.origin.country.toUpperCase()}
          </span>
          <h1>{meta?.headline || example.title}</h1>
          <p>
            {example.shortTitle} <span>→</span> A possibility for {profile.name}
          </p>
        </div>
        <div className="case-art-small">
          <ProjectArt id={example.id} />
        </div>
      </header>
      <div className="case-layout">
        <div className="case-main">
          <nav className="case-tabs" aria-label="Explore this idea">
            {[
              ["understand", "Understand the idea"],
              ["fit", "Check the local fit"],
              ["adapt", "Make it yours"],
            ].map(([key, label], i) => (
              <button
                key={key}
                aria-pressed={panel === key}
                onClick={() => setPanel(key)}
              >
                <span>0{i + 1}</span>
                {label}
              </button>
            ))}
          </nav>
          <section
            className="case-panel"
            aria-label={
              panel === "understand"
                ? "Understand the idea"
                : panel === "fit"
                  ? "Check the local fit"
                  : "Make it yours"
            }
          >
            {panel === "understand" && (
              <>
                <span className="eyebrow">WHAT HAPPENED ELSEWHERE</span>
                <h2>{example.title}.</h2>
                <p className="case-mechanism">{example.mechanism}</p>
                <div className="source-fact">
                  <strong>{example.fact.value}</strong>
                  <div>
                    <span>{example.fact.label}</span>
                    <small>{example.fact.asOf}</small>
                    <a
                      href={getSource(example.fact.sourceId)?.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {getSource(example.fact.sourceId)?.publisher}{" "}
                      <span>↗</span>
                    </a>
                  </div>
                </div>
                <div className="lesson-note">
                  <span>THE TRANSFERABLE IDEA</span>
                  <p>
                    {meta?.lesson || "Study the mechanism before adapting it."}
                  </p>
                </div>
                <details className="evidence-details">
                  <summary>
                    Read the evidence & limitations{" "}
                    <Icon name="plus" size={17} />
                  </summary>
                  {example.reportedOutcomes.map((o) => (
                    <p key={o}>{o}</p>
                  ))}
                  <p className="evidence-limit">{example.limitations}</p>
                  <SourceList ids={example.sources} />
                </details>
                <div className="panel-next">
                  <span>Now, bring your local context into the picture.</span>
                  <Button onClick={() => setPanel("fit")}>
                    Check the local fit <Icon />
                  </Button>
                </div>
              </>
            )}
            {panel === "fit" && (
              <>
                <span className="eyebrow">
                  FROM {example.origin.name.toUpperCase()} TO{" "}
                  {profile.name.toUpperCase()}
                </span>
                <h2>What would it take here?</h2>
                <p>
                  An idea can travel. Its conditions need checking. These are
                  suggested transfer checks, using your current brief.
                </p>
                {assessment ? (
                  <>
                    <div className="fit-connection">
                      <span>WHAT YOU CAN BUILD ON</span>
                      <p>{assessment.reasons[0]}</p>
                    </div>
                    <Readiness assessment={assessment} />
                    <Constraints profile={profile} />
                    <div className="peer-question">
                      <div>
                        <span className="eyebrow">
                          ONE QUESTION CAN MOVE THINGS FORWARD
                        </span>
                        <h3>{assessment.question}</h3>
                      </div>
                      <button className="quiet-link" onClick={ask}>
                        Draft this question <Icon name="chat" size={18} />
                      </button>
                    </div>
                    <div className="panel-next">
                      <span>Keep the useful parts. Adapt the rest.</span>
                      <Button onClick={() => setPanel("adapt")}>
                        Shape the local version <Icon />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p>
                    Your challenge has changed.{" "}
                    <Link to={`/community/${id}/matches`}>
                      Return to the current ideas.
                    </Link>
                  </p>
                )}
              </>
            )}
            {panel === "adapt" && (
              <>
                <span className="eyebrow">
                  YOUR LOCAL VERSION / A WORKING PROPOSAL
                </span>
                <h2>Make it belong to {profile.name}.</h2>
                <p>{localSuggestion(profile, example, "adaptation")}</p>
                <TextField
                  label="What could you try locally?"
                  multiline
                  value={proposal}
                  onChange={setProposal}
                />
                <p className="field-hint">
                  A proposal to investigate. Local resources, permissions and
                  outcomes are still to be established.
                </p>
                <div className="panel-next">
                  <span>Take this into a practical, editable pilot brief.</span>
                  <Button onClick={add} disabled={!assessment}>
                    Create a pilot brief <Icon />
                  </Button>
                </div>
              </>
            )}
          </section>
          {draft && (
            <section id="peer-draft" className="peer-draft">
              <span className="eyebrow">
                A QUESTION FOR {example.origin.name.toUpperCase()}
              </span>
              <h2>Ask what the report can’t tell you.</h2>
              <TextField
                label="Your draft question"
                value={draft.text}
                multiline
                onChange={(text) =>
                  update((s) => ({
                    ...s,
                    drafts: s.drafts.map((d) =>
                      d.id === draft.id
                        ? { ...d, text, updatedAt: new Date().toISOString() }
                        : d,
                    ),
                  }))
                }
              />
              <p className="micro">
                Saved locally. No message has been sent. Use the public source
                to identify the appropriate organisation.
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
                Remove draft <Icon name="close" size={15} />
              </button>
            </section>
          )}
        </div>
        <aside className="case-margin">
          <span className="eyebrow">YOUR LOCAL LENS</span>
          <h3>{profile.name}</h3>
          <p>
            {profile.goals.objective ||
              profile.goals.ambition ||
              "Explore a useful idea for your municipality."}
          </p>
          {assessment && <Status assessment={assessment} />}
          <dl>
            <div>
              <dt>Source evidence</dt>
              <dd>Documented project</dd>
            </div>
            <div>
              <dt>Local feasibility</dt>
              <dd>
                {assessment
                  ? `${assessment.readiness.filter((c) => c.state !== "met").length} checks to resolve`
                  : "Reassess your brief"}
              </dd>
            </div>
            <div>
              <dt>Local outcome</dt>
              <dd>To be tested</dd>
            </div>
          </dl>
          <Link className="quiet-link" to={`/community/${id}`}>
            Revisit your brief <Icon size={15} />
          </Link>
          <div className="margin-principle">
            <span>↗</span>
            <p>
              The best idea is the one
              <br />
              you can make your own.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
