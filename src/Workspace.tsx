import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  assetLabels,
  budgetLabels,
  examples,
  outcomesFor,
  staffLabels,
} from "./data";
import { assessMatches } from "./matching";
import { LiveWeather, useLive } from "./LiveContext";
import { SourceList } from "./SourceList";
import {
  Button,
  CommunityNav,
  EmptyState,
  Icon,
  SelectField,
  Status,
  useApp,
} from "./components";
import ProjectArt from "./ProjectArt";
import { projectPresentation } from "./projectPresentation";
import type {
  CommunityProfile,
  Knowledge,
  Budget,
  Staff,
  Domain,
  MatchAssessment,
} from "./model";
export const focusLabels: Record<string, string> = {
  heat: "Heat & shade",
  water: "Rain & water",
  services: "Public services",
};
const starterGoals: Record<string, string> = {
  heat: "Help residents find accessible, comfortable places during hot weather.",
  water: "Explore how public space can better accommodate heavy rain.",
  services: "Make essential city advice easier for residents to access.",
};
export function Constraints({ profile }: { profile: CommunityProfile }) {
  const { saveProfile } = useApp();
  const patch = (v: Partial<CommunityProfile>) =>
    saveProfile({
      ...profile,
      ...v,
      updatedAt: new Date().toISOString(),
      fieldProvenance: {
        ...profile.fieldProvenance,
        ...Object.fromEntries(
          Object.keys(v).map((k) => [k, "local user entry" as const]),
        ),
      },
    });
  const assets = [
    ...new Set(
      examples
        .filter((e) => profile.problems.includes(e.domain))
        .flatMap((e) => e.preconditions.map((p) => p.asset)),
    ),
  ];
  return (
    <details className="constraints">
      <summary>
        Resources & local conditions{" "}
        <span>
          Adjust the comparison <Icon name="plus" size={16} />
        </span>
      </summary>
      <p className="micro">
        Your planning inputs. Leave anything you have not confirmed as unknown.
      </p>
      <div className="form-grid">
        <SelectField
          label="Available budget"
          value={profile.resources.budget}
          options={budgetLabels}
          onChange={(v) =>
            patch({ resources: { ...profile.resources, budget: v as Budget } })
          }
        />
        <SelectField
          label="Available staff"
          value={profile.resources.staff}
          options={staffLabels}
          onChange={(v) =>
            patch({ resources: { ...profile.resources, staff: v as Staff } })
          }
        />
        <SelectField
          label="Intended direction"
          value={profile.goals.outcome}
          options={outcomesFor(profile.problems[0])}
          onChange={(v) => patch({ goals: { ...profile.goals, outcome: v } })}
        />
        {assets.map((key) => (
          <SelectField
            key={key}
            label={assetLabels[key]}
            value={profile.assets[key]}
            options={{
              unknown: "Not yet confirmed",
              yes: "Available — confirmed by you",
              no: "Not available",
            }}
            onChange={(v) =>
              patch({ assets: { ...profile.assets, [key]: v as Knowledge } })
            }
          />
        ))}
      </div>
    </details>
  );
}
export function MatchRow({
  assessment: a,
  profile,
  index,
}: {
  assessment: MatchAssessment;
  profile: CommunityProfile;
  index: number;
}) {
  const meta = projectPresentation[a.example.id];
  return (
    <Link
      className="idea-row"
      to={`/community/${profile.id}/matches/${a.example.id}`}
    >
      <span className="idea-row-index">0{index + 1}</span>
      <div>
        <span className="eyebrow">
          {a.example.origin.name}, {a.example.origin.country}
        </span>
        <h3>{meta?.headline || a.example.title}</h3>
        <p>{a.reasons[0]}</p>
      </div>
      <div className="idea-row-end">
        <Status assessment={a} />
        <span>
          Explore the idea <Icon size={19} />
        </span>
      </div>
    </Link>
  );
}
export default function Workspace({
  matchesOnly = false,
}: {
  matchesOnly?: boolean;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, saveProfile } = useApp();
  const [showBlocked, setShowBlocked] = useState(true);
  const live = useLive();
  const profile = state.profiles.find((p) => p.id === id);
  if (!profile) return <Missing />;
  const focus = profile.problems[0];
  const matches = assessMatches(profile, examples),
    visible = showBlocked
      ? matches
      : matches.filter(
          (a) => a.category !== "Does not fit current constraints",
        ),
    best = visible[0];
  const guided = state.advisor?.entryMode === "guided" && id === "krakow";
  const setFocus = (domain: Domain) =>
    saveProfile({
      ...profile,
      problems: [domain],
      goals: {
        ...profile.goals,
        outcome: "all",
        objective:
          profile.fieldProvenance.objective === "local user entry" ||
          (profile.goals.objective &&
            !Object.values(starterGoals).includes(profile.goals.objective))
            ? profile.goals.objective
            : "",
        ambition: starterGoals[domain] || "",
      },
      updatedAt: new Date().toISOString(),
      fieldProvenance: {
        ...profile.fieldProvenance,
        goals: "proposed focus",
        problems: "local user entry",
      },
    });
  const focusControls = (
    <div className="focus-controls" aria-label="Choose your challenge">
      {Object.entries(focusLabels).map(([key, label]) => (
        <button
          key={key}
          aria-pressed={focus === key}
          onClick={() => setFocus(key as Domain)}
        >
          <Icon
            name={key === "heat" ? "sun" : key === "water" ? "leaf" : "chat"}
            size={18}
          />
          {label}
        </button>
      ))}
    </div>
  );
  const goal =
    profile.fieldProvenance.objective === "local user entry"
      ? profile.goals.objective
      : profile.goals.objective || starterGoals[focus] || "";
  return (
    <div className="work-page page-width">
      <CommunityNav profile={profile} />
      {matchesOnly ? (
        <>
          <header className="work-heading">
            <div>
              <span className="eyebrow">
                A WIDER PERSPECTIVE / {profile.name.toUpperCase()}
              </span>
              <h1>
                Look elsewhere.
                <br />
                <span className="blue-text">Think locally.</span>
              </h1>
            </div>
            <p>
              Real projects to investigate for your{" "}
              {focusLabels[focus]?.toLowerCase() || "selected"} challenge. See
              what you can reuse, and what would need to change.
            </p>
          </header>
          <div className="explore-toolbar">
            {focusControls}
            <span>
              {visible.length} documented{" "}
              {visible.length === 1 ? "project" : "projects"}
            </span>
          </div>
          {best ? (
            <article className="featured-idea">
              <Link
                className="featured-art"
                to={`/community/${id}/matches/${best.example.id}`}
                aria-label={`Explore ${best.example.origin.name}: ${best.example.shortTitle}`}
              >
                <ProjectArt id={best.example.id} />
              </Link>
              <div className="featured-content">
                <span className="eyebrow">
                  A STARTING POINT / {best.example.origin.name.toUpperCase()}
                </span>
                <h2>
                  {projectPresentation[best.example.id]?.headline ||
                    best.example.title}
                </h2>
                <p>{projectPresentation[best.example.id]?.lesson}</p>
                <div className="featured-reason">
                  <Icon name="pin" size={18} />
                  <span>{best.reasons[0]}</span>
                </div>
                <Status assessment={best} />
                <Link
                  className="button"
                  to={`/community/${id}/matches/${best.example.id}`}
                >
                  Explore this idea <Icon />
                </Link>
                <small>
                  Source-linked evidence · Local feasibility to confirm
                </small>
              </div>
            </article>
          ) : (
            <EmptyState title="A different starting point.">
              <p>
                No project in this curated catalogue fits the current filters.
                Adjust the challenge or review the local conditions.
              </p>
            </EmptyState>
          )}
          {visible.length > 1 && (
            <section className="other-ideas">
              <div className="section-title">
                <h2>Other ways to think about it.</h2>
                <span>COMPARE PERSPECTIVES</span>
              </div>
              {visible.slice(1).map((a, i) => (
                <MatchRow
                  key={a.example.id}
                  assessment={a}
                  profile={profile}
                  index={i + 1}
                />
              ))}
            </section>
          )}
          <div className="explore-detail">
            <Constraints profile={profile} />
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showBlocked}
                onChange={(e) => setShowBlocked(e.target.checked)}
              />{" "}
              Include projects with unmet requirements
            </label>
          </div>
          <details className="method-disclosure">
            <summary>
              Why these ideas appear here <Icon name="plus" size={17} />
            </summary>
            <p>
              We filter by your challenge and intended direction, then compare
              prerequisites and connections to existing initiatives. Unmet
              requirements come after unknowns. The ordering is a transparent
              set of rules, not a prediction of success.
            </p>
            <p>
              Within each readiness group: selected priority +40, same setting
              +5, initiative keyword connections +15 each (up to 30),
              user-confirmed checks +4, unknown checks −3. No score overrides an
              unmet prerequisite. Live weather does not change these scores.
            </p>
          </details>
        </>
      ) : (
        <>
          {guided && (
            <div className="walkthrough-note">
              <span>THE KRAKÓW WALKTHROUGH</span>
              <p>
                You’re in the advisor’s seat. Start with a local challenge, then
                explore what another place can teach you.
              </p>
              <Link to="/enter">
                Use my municipality <Icon size={15} />
              </Link>
            </div>
          )}
          <header className="work-heading brief-heading">
            <div>
              <span className="eyebrow">
                YOUR MUNICIPALITY / YOUR STARTING POINT
              </span>
              <h1>
                What’s next
                <br />
                for <span className="blue-text">{profile.name}?</span>
              </h1>
            </div>
            <p>
              Good innovation starts with a clear local question. Let’s give
              yours a little direction.
            </p>
          </header>
          <div className="brief-layout">
            <section className="brief-editor">
              <div className="question-heading">
                <span>01</span>
                <div>
                  <h2>What would you like to improve?</h2>
                  <p>Pick a focus for your first exploration.</p>
                </div>
              </div>
              {focusControls}
              <label className="goal-label" htmlFor="local-goal">
                The change you want to explore
              </label>
              <textarea
                id="local-goal"
                value={goal}
                rows={3}
                onChange={(e) =>
                  saveProfile({
                    ...profile,
                    goals: { ...profile.goals, objective: e.target.value },
                    fieldProvenance: {
                      ...profile.fieldProvenance,
                      goals: "local user entry",
                      objective: "local user entry",
                    },
                    updatedAt: new Date().toISOString(),
                  })
                }
              />
              <p className="field-hint">
                A working ambition. You can refine it as you learn.
              </p>
              <Constraints profile={profile} />
              <div className="brief-next">
                <Button
                  onClick={() => {
                    saveProfile({
                      ...profile,
                      goals: { ...profile.goals, objective: goal },
                      updatedAt: new Date().toISOString(),
                    });
                    navigate(`/community/${id}/matches`);
                  }}
                >
                  Find relevant ideas <Icon />
                </Button>
                <span>
                  {matches.length} documented{" "}
                  {matches.length === 1 ? "project" : "projects"} to explore
                </span>
              </div>
            </section>
            <aside className="local-context">
              <div className="context-top">
                <span className="eyebrow">BUILD ON WHAT’S ALREADY HERE</span>
                <span className="context-orbit" aria-hidden="true">
                  ↗
                </span>
              </div>
              <h2>
                {profile.name},<br />
                as a starting point.
              </h2>
              <p>
                {profile.context.geography ||
                  "Your local knowledge starts the brief. Add context and existing initiatives as you learn more."}
              </p>
              <ul>
                {profile.existingInitiatives.map((i) => (
                  <li key={i}>
                    <Icon name="check" size={15} />
                    {i}
                  </li>
                ))}
              </ul>
              {profile.existingInitiatives.length === 0 && (
                <Link className="quiet-link" to={`/start?edit=${id}`}>
                  Add what’s already in place <Icon size={16} />
                </Link>
              )}
              {!!profile.sources?.length && (
                <details className="context-sources">
                  <summary>
                    View the local sources <span>↗</span>
                  </summary>
                  <SourceList ids={profile.sources} compact />
                  <p className="micro">
                    Published context does not confirm a site, staff or funds
                    for your pilot.
                  </p>
                </details>
              )}
              {id === "krakow" && (
                <details className="weather-drawer">
                  <summary>
                    <span className="weather-mini-icon">
                      <Icon name="sun" size={22} />
                    </span>
                    <div>
                      <strong>Weather, as context</strong>
                      <span>
                        {live.observation.data
                          ? `${live.observation.data.temperature.toFixed(1)}°C · Latest IMGW station report`
                          : "Live station data & seven-day forecast"}
                      </span>
                    </div>
                    <span>+</span>
                  </summary>
                  <LiveWeather />
                </details>
              )}
            </aside>
          </div>
          {(state.plans.some((p) => p.communityId === id) ||
            state.drafts.some((d) => d.communityId === id)) && (
            <section className="continue-work">
              <span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span>
              {state.plans.some((p) => p.communityId === id) && (
                <Link to={`/community/${id}/plan`}>
                  <span>
                    Your working pilot brief
                    <small>Locally saved · Ready when you are</small>
                  </span>
                  <Icon />
                </Link>
              )}
              {state.drafts
                .filter((d) => d.communityId === id)
                .map((d) => (
                  <Link
                    key={d.id}
                    to={`/community/${id}/matches/${d.exampleId}#peer-draft`}
                  >
                    <span>
                      A question for{" "}
                      {examples.find((e) => e.id === d.exampleId)?.origin.name}
                      <small>Draft only · Not sent</small>
                    </span>
                    <Icon />
                  </Link>
                ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
export function Missing() {
  return (
    <div className="missing page-width">
      <span className="eyebrow">A DIFFERENT DIRECTION / 404</span>
      <h1>
        Let’s find your
        <br />
        <span className="blue-text">way back.</span>
      </h1>
      <p>This place or page isn’t in your workspace.</p>
      <Button to="/enter">
        Open a workspace <Icon />
      </Button>
    </div>
  );
}
