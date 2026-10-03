import { t as tr } from "./i18n";
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
        {tr("Resources & local conditions")}
        {tr(" ")}
        <span>
          {tr("Adjust the comparison ")}
          <Icon name="plus" size={16} />
        </span>
      </summary>
      <p className="micro">
        {tr(
          "Your planning inputs. Leave anything you have not confirmed as unknown.",
        )}
      </p>
      <div className="form-grid">
        <SelectField
          label={tr("Available budget")}
          value={profile.resources.budget}
          options={budgetLabels}
          onChange={(v) =>
            patch({
              resources: {
                ...profile.resources,
                budget: v as Budget,
              },
            })
          }
        />
        <SelectField
          label={tr("Available staff")}
          value={profile.resources.staff}
          options={staffLabels}
          onChange={(v) =>
            patch({
              resources: {
                ...profile.resources,
                staff: v as Staff,
              },
            })
          }
        />
        <SelectField
          label={tr("Intended direction")}
          value={profile.goals.outcome}
          options={outcomesFor(profile.problems[0])}
          onChange={(v) =>
            patch({
              goals: {
                ...profile.goals,
                outcome: v,
              },
            })
          }
        />
        {tr(
          assets.map((key) => (
            <SelectField
              key={key}
              label={tr(assetLabels[key])}
              value={profile.assets[key]}
              options={{
                unknown: "Not yet confirmed",
                yes: "Available — confirmed by you",
                no: "Not available",
              }}
              onChange={(v) =>
                patch({
                  assets: {
                    ...profile.assets,
                    [key]: v as Knowledge,
                  },
                })
              }
            />
          )),
        )}
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
      <span className="idea-row-index">
        {tr("0")}
        {tr(index + 1)}
      </span>
      <div>
        <span className="eyebrow">
          {tr(a.example.origin.name)}
          {tr(", ")}
          {tr(a.example.origin.country)}
        </span>
        <h3>{tr(meta?.headline || a.example.title)}</h3>
        <p>{tr(a.reasons[0])}</p>
      </div>
      <div className="idea-row-end">
        <Status assessment={a} />
        <span>
          {tr("Explore the idea ")}
          <Icon size={19} />
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
    <div className="focus-controls" aria-label={tr("Choose your challenge")}>
      {tr(
        Object.entries(focusLabels).map(([key, label]) => (
          <button
            key={key}
            aria-pressed={focus === key}
            onClick={() => setFocus(key as Domain)}
          >
            <Icon
              name={key === "heat" ? "sun" : key === "water" ? "leaf" : "chat"}
              size={18}
            />
            {tr(label)}
          </button>
        )),
      )}
    </div>
  );
  const goal =
    profile.fieldProvenance.objective === "local user entry"
      ? profile.goals.objective
      : profile.goals.objective || starterGoals[focus] || "";
  return (
    <div className="work-page page-width">
      <CommunityNav profile={profile} />
      {tr(
        matchesOnly ? (
          <>
            <header className="work-heading">
              <div>
                <span className="eyebrow">
                  {tr("A WIDER PERSPECTIVE / ")}
                  {tr(profile.name.toUpperCase())}
                </span>
                <h1>
                  {tr("Look elsewhere.")}
                  <br />
                  <span className="blue-text">{tr("Think locally.")}</span>
                </h1>
              </div>
              <p>
                {tr(
                  "Real projects related to your selected challenge. See what you can reuse and what needs to change.",
                )}
              </p>
            </header>
            <div className="explore-toolbar">
              {tr(focusControls)}
              <span>
                {tr(visible.length)}
                {tr(" documented")}
                {tr(" ")}
                {tr(visible.length === 1 ? "project" : "projects")}
              </span>
            </div>
            {tr(
              best ? (
                <article className="featured-idea">
                  <Link
                    className="featured-art"
                    to={`/community/${id}/matches/${best.example.id}`}
                    aria-label={tr(
                      `Explore ${best.example.origin.name}: ${best.example.shortTitle}`,
                    )}
                  >
                    <ProjectArt id={best.example.id} />
                  </Link>
                  <div className="featured-content">
                    <span className="eyebrow">
                      {tr("A STARTING POINT / ")}
                      {tr(best.example.origin.name.toUpperCase())}
                    </span>
                    <h2>
                      {tr(
                        projectPresentation[best.example.id]?.headline ||
                          best.example.title,
                      )}
                    </h2>
                    <p>{tr(projectPresentation[best.example.id]?.lesson)}</p>
                    <div className="featured-reason">
                      <Icon name="pin" size={18} />
                      <span>{tr(best.reasons[0])}</span>
                    </div>
                    <Status assessment={best} />
                    <Link
                      className="button"
                      to={`/community/${id}/matches/${best.example.id}`}
                    >
                      {tr("Explore this idea ")}
                      <Icon />
                    </Link>
                    <small>
                      {tr(
                        "Source-linked evidence · Local feasibility to confirm",
                      )}
                    </small>
                  </div>
                </article>
              ) : (
                <EmptyState title={tr("A different starting point.")}>
                  <p>
                    {tr(
                      "No project in this curated catalogue fits the current filters. Adjust the challenge or review the local conditions.",
                    )}
                  </p>
                </EmptyState>
              ),
            )}
            {tr(
              visible.length > 1 && (
                <section className="other-ideas">
                  <div className="section-title">
                    <h2>{tr("Other ways to think about it.")}</h2>
                    <span>{tr("COMPARE PERSPECTIVES")}</span>
                  </div>
                  {tr(
                    visible
                      .slice(1)
                      .map((a, i) => (
                        <MatchRow
                          key={a.example.id}
                          assessment={a}
                          profile={profile}
                          index={i + 1}
                        />
                      )),
                  )}
                </section>
              ),
            )}
            <div className="explore-detail">
              <Constraints profile={profile} />
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showBlocked}
                  onChange={(e) => setShowBlocked(e.target.checked)}
                />
                {tr(" ")}
                {tr("Include projects with unmet requirements")}
              </label>
            </div>
            <details className="method-disclosure">
              <summary>
                {tr("Why these ideas appear here ")}
                <Icon name="plus" size={17} />
              </summary>
              <p>
                {tr(
                  "We filter by your challenge and intended direction, then compare prerequisites and connections to existing initiatives. Unmet requirements come after unknowns. The ordering is a transparent set of rules, not a prediction of success.",
                )}
              </p>
              <p>
                {tr(
                  "Within each readiness group: selected priority +40, same setting +5, initiative keyword connections +15 each (up to 30), user-confirmed checks +4, unknown checks −3. No score overrides an unmet prerequisite. Live weather does not change these scores.",
                )}
              </p>
            </details>
          </>
        ) : (
          <>
            {tr(
              guided && (
                <div className="walkthrough-note">
                  <span>{tr("THE KRAKÓW WALKTHROUGH")}</span>
                  <p>
                    {tr(
                      "You’re in the advisor’s seat. Start with a local challenge, then explore what another place can teach you.",
                    )}
                  </p>
                  <Link to="/enter">
                    {tr("Use my municipality ")}
                    <Icon size={15} />
                  </Link>
                </div>
              ),
            )}
            <header className="work-heading brief-heading">
              <div>
                <span className="eyebrow">
                  {tr("YOUR MUNICIPALITY / YOUR STARTING POINT")}
                </span>
                <h1>
                  {tr("What’s next")}
                  <br />
                  {tr("for ")}
                  <span className="blue-text">
                    {profile.name}
                    {tr("?")}
                  </span>
                </h1>
              </div>
              <p>
                {tr(
                  "Good innovation starts with a clear local question. Let’s give yours a little direction.",
                )}
              </p>
            </header>
            <div className="brief-layout">
              <section className="brief-editor">
                <div className="question-heading">
                  <span>{tr("01")}</span>
                  <div>
                    <h2>{tr("What would you like to improve?")}</h2>
                    <p>{tr("Pick a focus for your first exploration.")}</p>
                  </div>
                </div>
                {tr(focusControls)}
                <label className="goal-label" htmlFor="local-goal">
                  {tr("The change you want to explore")}
                </label>
                <textarea
                  id="local-goal"
                  value={goal}
                  rows={3}
                  onChange={(e) =>
                    saveProfile({
                      ...profile,
                      goals: {
                        ...profile.goals,
                        objective: e.target.value,
                      },
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
                  {tr("A working ambition. You can refine it as you learn.")}
                </p>
                <Constraints profile={profile} />
                <div className="brief-next">
                  <Button
                    onClick={() => {
                      saveProfile({
                        ...profile,
                        goals: {
                          ...profile.goals,
                          objective: goal,
                        },
                        updatedAt: new Date().toISOString(),
                      });
                      navigate(`/community/${id}/matches`);
                    }}
                  >
                    {tr("Find relevant ideas ")}
                    <Icon />
                  </Button>
                  <span>
                    {tr(matches.length)}
                    {tr(" documented")}
                    {tr(" ")}
                    {tr(matches.length === 1 ? "project" : "projects")}
                    {tr(" to explore")}
                  </span>
                </div>
              </section>
              <aside className="local-context">
                <div className="context-top">
                  <span className="eyebrow">
                    {tr("BUILD ON WHAT’S ALREADY HERE")}
                  </span>
                  <span className="context-orbit" aria-hidden="true">
                    {tr("↗")}
                  </span>
                </div>
                <h2>
                  {profile.name}
                  {tr(",")}
                  <br />
                  {tr("as a starting point.")}
                </h2>
                <p>
                  {tr(
                    profile.context.geography ||
                      "Your local knowledge starts the brief. Add context and existing initiatives as you learn more.",
                  )}
                </p>
                <ul>
                  {tr(
                    profile.existingInitiatives.map((i) => (
                      <li key={i}>
                        <Icon name="check" size={15} />
                        {tr(i)}
                      </li>
                    )),
                  )}
                </ul>
                {tr(
                  profile.existingInitiatives.length === 0 && (
                    <Link className="quiet-link" to={`/start?edit=${id}`}>
                      {tr("Add what’s already in place ")}
                      <Icon size={16} />
                    </Link>
                  ),
                )}
                {tr(
                  !!profile.sources?.length && (
                    <details className="context-sources">
                      <summary>
                        {tr("View the local sources ")}
                        <span>{tr("↗")}</span>
                      </summary>
                      <SourceList ids={profile.sources} compact />
                      <p className="micro">
                        {tr(
                          "Published context does not confirm a site, staff or funds for your pilot.",
                        )}
                      </p>
                    </details>
                  ),
                )}
                {tr(
                  id === "krakow" && (
                    <details className="weather-drawer">
                      <summary>
                        <span className="weather-mini-icon">
                          <Icon name="sun" size={22} />
                        </span>
                        <div>
                          <strong>{tr("Weather, as context")}</strong>
                          <span>
                            {tr(
                              live.observation.data
                                ? `${live.observation.data.temperature.toFixed(1)}°C · Latest IMGW station report`
                                : "Live station data & seven-day forecast",
                            )}
                          </span>
                        </div>
                        <span>{tr("+")}</span>
                      </summary>
                      <LiveWeather />
                    </details>
                  ),
                )}
              </aside>
            </div>
            {tr(
              (state.plans.some((p) => p.communityId === id) ||
                state.drafts.some((d) => d.communityId === id)) && (
                <section className="continue-work">
                  <span className="eyebrow">
                    {tr("PICK UP WHERE YOU LEFT OFF")}
                  </span>
                  {tr(
                    state.plans.some((p) => p.communityId === id) && (
                      <Link to={`/community/${id}/plan`}>
                        <span>
                          {tr("Your working pilot brief")}
                          <small>
                            {tr("Locally saved · Ready when you are")}
                          </small>
                        </span>
                        <Icon />
                      </Link>
                    ),
                  )}
                  {tr(
                    state.drafts
                      .filter((d) => d.communityId === id)
                      .map((d) => (
                        <Link
                          key={d.id}
                          to={`/community/${id}/matches/${d.exampleId}#peer-draft`}
                        >
                          <span>
                            {tr("A question for")}
                            {tr(" ")}
                            {tr(
                              examples.find((e) => e.id === d.exampleId)?.origin
                                .name,
                            )}
                            <small>{tr("Draft only · Not sent")}</small>
                          </span>
                          <Icon />
                        </Link>
                      )),
                  )}
                </section>
              ),
            )}
          </>
        ),
      )}
    </div>
  );
}
export function Missing() {
  return (
    <div className="missing page-width">
      <span className="eyebrow">{tr("A DIFFERENT DIRECTION / 404")}</span>
      <h1>
        {tr("Let’s find your")}
        <br />
        <span className="blue-text">{tr("way back.")}</span>
      </h1>
      <p>{tr("This place or page isn’t in your workspace.")}</p>
      <Button to="/enter">
        {tr("Open a workspace ")}
        <Icon />
      </Button>
    </div>
  );
}
