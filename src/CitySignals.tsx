import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon } from "./components";
import { Missing } from "./Workspace";
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
  const signals = summarizeReports(civic.reports);
  const last = civic.runs.find((r) => r.status === "complete");
  const stale = last && last.fingerprint !== runFingerprint(profile, civic);
  const next = !civic.authority.confirmed ? "data" : "agents";
  const counts = civic.reports.filter(
    (r) => !r.duplicateOf && r.status === "received",
  );
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">LISTEN LOCALLY. LEARN GLOBALLY.</span>
          <h1>
            What’s your city
            <br />
            <span className="blue-text">telling you?</span>
          </h1>
        </div>
        <div>
          <p>
            A shared view of resident needs, municipal knowledge and the ideas
            worth investigating for {profile.name}.
          </p>
          <Button to={`/community/${id}/${next}`}>
            {next === "data"
              ? "Connect your team’s knowledge"
              : "Open the agent studio"}{" "}
            <Icon />
          </Button>
        </div>
      </div>
      <div className="journey-ribbon">
        {[
          [
            "data",
            "01",
            "Connect your team",
            "Confirm the authority and shared data.",
          ],
          [
            "reports",
            "02",
            "Listen to residents",
            "Collect reports and ideas.",
          ],
          [
            "agents",
            "03",
            "Watch the research",
            "Inspect each agent’s evidence.",
          ],
          [
            "opportunities",
            "04",
            "Review possibilities",
            "Decide what deserves a pilot.",
          ],
        ].map(([path, n, title, detail]) => (
          <Link
            to={`/community/${id}${path === "signals" ? "" : "/" + path}`}
            key={path}
          >
            <span>{n}</span>
            <div>
              <strong>{title}</strong>
              <small>{detail}</small>
            </div>
            <Icon size={16} />
          </Link>
        ))}
      </div>
      <div className="signals-layout">
        <section>
          <div className="civic-section-title">
            <div>
              <span className="eyebrow">THE LOCAL SIGNAL</span>
              <h2>Needs, in residents’ words.</h2>
            </div>
            <Link className="quiet-link" to={`/community/${id}/reports`}>
              Open intake <Icon size={16} />
            </Link>
          </div>
          <p className="micro">
            Ranked by unique eligible complaints submitted here. These counts
            are not a representative survey of {profile.name}.
          </p>
          {signals.length ? (
            <div className="topic-ranking">
              {signals.map((s, i) => (
                <div key={s.topic}>
                  <span className="topic-rank">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{topicLabels[s.topic]}</h3>
                    <p>{s.summary}</p>
                    <div className="signal-bar">
                      <i
                        style={{
                          width: `${Math.max(3, (s.count / Math.max(...signals.map((x) => x.count), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <strong>
                    {s.count}
                    <small>complaints</small>
                  </strong>
                </div>
              ))}
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
              <h3>Start by listening.</h3>
              <p>
                No resident reports have been submitted here yet. Open the
                resident space to add a real concern or an idea. The agents can
                also start from your municipal brief.
              </p>
              <Button secondary to={`/report/${id}`}>
                Open resident space <Icon />
              </Button>
            </div>
          )}
          <div className="signal-totals">
            <div>
              <strong>
                {counts.filter((r) => r.kind === "complaint").length}
              </strong>
              <span>eligible complaints</span>
            </div>
            <div>
              <strong>{counts.filter((r) => r.kind === "idea").length}</strong>
              <span>resident ideas</span>
            </div>
            <div>
              <strong>
                {
                  civic.reports.filter(
                    (r) => r.status === "needs-review" || r.duplicateOf,
                  ).length
                }
              </strong>
              <span>awaiting intake review / duplicates</span>
            </div>
          </div>
        </section>
        <aside className="city-intelligence-note">
          <span className="eyebrow">YOUR RESEARCH TEAM</span>
          <h2>
            Five agents.
            <br />
            One visible trail.
          </h2>
          <div className="agent-mini-list">
            {[
              "Listener",
              "City analyst",
              "Research scout",
              "Fit reviewer",
              "Brief writer",
            ].map((name, i) => (
              <div key={name}>
                <span className={`agent-dot agent-${i}`} />
                <strong>{name}</strong>
                <span>{last ? "Run recorded" : "Ready to start"}</span>
              </div>
            ))}
          </div>
          <p>
            {last
              ? stale
                ? "Your inputs changed. Re-run the agents to update the evidence."
                : `Last completed ${last.mode === "ai" ? "AI research" : "local analysis"}: ${new Date(last.completedAt).toLocaleString()}.`
              : "Share your context, then watch reports become a research brief. Local analysis is ready; live AI requires the research connection."}
          </p>
          <Link to={`/community/${id}/agents`} className="quiet-link">
            See how the agents work <Icon size={16} />
          </Link>
          <div className="agent-mode-note">
            {allowed(civic, "reports")
              ? "Resident intake shared with local analysis"
              : "Resident intake withheld from analysis"}
          </div>
        </aside>
      </div>
      <section className="signal-bottom">
        <div>
          <span className="eyebrow">KEEP THE MUNICIPALITY IN THE LOOP</span>
          <h2>
            A change deserves
            <br />a second look.
          </h2>
        </div>
        <p>
          Monitor the public sources behind the ideas. Page changes arrive in an
          inbox for review; they are never silently treated as a new, verified
          solution.
        </p>
        <Link className="button secondary" to={`/community/${id}/monitor`}>
          Open monitoring <Icon />
        </Link>
      </section>
    </div>
  );
}
