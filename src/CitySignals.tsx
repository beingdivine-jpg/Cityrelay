import { t as tr, locale } from "./i18n";
import { useParams } from "react-router-dom";
import { Link } from "./navigation";
import { Button, CommunityNav, Icon } from "./components";
import { Missing } from "./Workspace";
import { DEMO_ID } from "./demo";
import ResidentDesk from "./ResidentDesk";
import { useCivic } from "./CivicContext";
import {
  allowed,
  runFingerprint,
  summarizeReports,
  topicLabels,
} from "./civicEngine";
export default function CitySignals() {
  const { id = "" } = useParams();
  const { profile, civic } = useCivic(id);
  if (!profile || !civic) return <Missing />;
  if (id === DEMO_ID) return <ResidentDesk profile={profile} civic={civic} />;
  const signals = summarizeReports(civic.reports);
  const last = civic.runs.find((r) => r.status === "complete");
  const stale = last && last.fingerprint !== runFingerprint(profile, civic);
  const next =
    !profile.problems.length || profile.problems.includes("unknown")
      ? "challenge"
      : "agents";
  const counts = civic.reports.filter(
    (r) => !r.duplicateOf && r.status === "received",
  );
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">
            {tr("LISTEN LOCALLY. LEARN GLOBALLY.")}
          </span>
          <h1>
            {tr("What’s your city")}
            <br />
            <span className="blue-text">{tr("telling you?")}</span>
          </h1>
        </div>
        <div>
          <p>
            {tr(
              "A shared view of resident needs, municipal knowledge and the ideas worth investigating for ",
            )}
            {profile.name}.
          </p>
          <Button to={`/community/${id}/${next}`}>
            {tr(
              next === "challenge"
                ? "Choose your challenge"
                : "Open the agent studio",
            )}
            {tr(" ")}
            <Icon />
          </Button>
        </div>
      </div>
      <div className="signals-layout">
        <section>
          <div className="civic-section-title">
            <div>
              <span className="eyebrow">{tr("THE LOCAL SIGNAL")}</span>
              <h2>{tr("Needs, in residents’ words.")}</h2>
            </div>
            <Link className="quiet-link" to={`/community/${id}/reports`}>
              {tr("Open intake ")}
              <Icon size={16} />
            </Link>
          </div>
          <p className="micro">
            {tr(
              "Ranked by unique eligible complaints submitted here. These counts are not a representative survey of ",
            )}
            {profile.name}
            {tr(".")}
          </p>
          {tr(
            signals.length ? (
              <div className="topic-ranking">
                {tr(
                  signals.map((s, i) => (
                    <div key={s.topic}>
                      <span className="topic-rank">
                        {tr(String(i + 1).padStart(2, "0"))}
                      </span>
                      <div>
                        <h3>{tr(topicLabels[s.topic])}</h3>
                        <p>{tr(s.summary)}</p>
                        <div className="signal-bar">
                          <i
                            style={{
                              width: `${Math.max(3, (s.count / Math.max(...signals.map((x) => x.count), 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <strong>
                        {tr(s.count)}
                        <small>{tr("complaints")}</small>
                      </strong>
                    </div>
                  )),
                )}
              </div>
            ) : (
              <div className="signal-empty">
                <div className="listening-art" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <h3>{tr("Start by listening.")}</h3>
                <p>
                  {tr(
                    "No resident reports have been submitted here yet. Open the resident space to add a real concern or an idea. The agents can also start from your municipal brief.",
                  )}
                </p>
                <Button secondary to={`/report/${id}`}>
                  {tr("Open resident space ")}
                  <Icon />
                </Button>
              </div>
            ),
          )}
          <div className="signal-totals">
            <div>
              <strong>
                {tr(counts.filter((r) => r.kind === "complaint").length)}
              </strong>
              <span>{tr("eligible complaints")}</span>
            </div>
            <div>
              <strong>
                {tr(counts.filter((r) => r.kind === "idea").length)}
              </strong>
              <span>{tr("resident ideas")}</span>
            </div>
            <div>
              <strong>
                {tr(
                  civic.reports.filter(
                    (r) => r.status === "needs-review" || r.duplicateOf,
                  ).length,
                )}
              </strong>
              <span>{tr("awaiting intake review / duplicates")}</span>
            </div>
          </div>
        </section>
        <aside className="city-intelligence-note">
          <span className="eyebrow">{tr("YOUR RESEARCH TEAM")}</span>
          <h2>
            {tr("Five agents.")}
            <br />
            {tr("One visible trail.")}
          </h2>
          <div className="agent-mini-list">
            {tr(
              [
                "Listener",
                "City analyst",
                "Research scout",
                "Fit reviewer",
                "Brief writer",
              ].map((name, i) => (
                <div key={name}>
                  <span className={`agent-dot agent-${i}`} />
                  <strong>{tr(name)}</strong>
                  <span>{tr(last ? "Run recorded" : "Ready to start")}</span>
                </div>
              )),
            )}
          </div>
          <p>
            {tr(
              last
                ? stale
                  ? "Your inputs changed. Re-run the agents to update the evidence."
                  : `Last completed ${last.mode === "ai" ? "AI research" : "local analysis"}: ${new Date(last.completedAt).toLocaleString(locale())}.`
                : "Share your context, then watch reports become a research brief. Local analysis is ready; live AI requires the research connection.",
            )}
          </p>
          <Link to={`/community/${id}/agents`} className="quiet-link">
            {tr("See how the agents work ")}
            <Icon size={16} />
          </Link>
          <div className="agent-mode-note">
            {tr(
              allowed(civic, "reports")
                ? "Resident intake shared with local analysis"
                : "Resident intake withheld from analysis",
            )}
          </div>
        </aside>
      </div>
      <section className="signal-bottom">
        <div>
          <span className="eyebrow">
            {tr("KEEP THE MUNICIPALITY IN THE LOOP")}
          </span>
          <h2>
            {tr("A change deserves")}
            <br />
            {tr("a second look.")}
          </h2>
        </div>
        <p>
          {tr(
            "Monitor the public sources behind the ideas. Page changes arrive in an inbox for review; they are never silently treated as a new, verified solution.",
          )}
        </p>
        <Link className="button secondary" to={`/community/${id}/monitor`}>
          {tr("Open monitoring ")}
          <Icon />
        </Link>
      </section>
    </div>
  );
}
