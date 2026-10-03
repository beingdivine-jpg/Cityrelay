import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon } from "./components";
import {
  applySnapshots,
  checkSources,
  useAgentService,
  useCivic,
} from "./CivicContext";
import { Missing } from "./Workspace";
export default function CityMonitor() {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
  const service = useAgentService();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!profile || !civic) return <Missing />;
  async function check() {
    if (!civic || busy) return;
    setBusy(true);
    setError("");
    try {
      const snapshots = await checkSources(civic);
      change((c) => applySnapshots(c, snapshots));
      if (snapshots.every((s) => s.status === "unavailable"))
        setError(
          "No source could be checked successfully. Failure details are shown below; no new finding is claimed.",
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Source check failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">KEEP YOUR LOCAL KNOWLEDGE CONNECTED</span>
          <h1>
            The world moves.
            <br />
            <span className="blue-text">Stay in the loop.</span>
          </h1>
        </div>
        <p>
          Monitor documented public sources, notice changes in your municipal
          inputs and bring promising developments back for advisor review.
        </p>
      </div>
      <div className="monitor-control">
        <div className="radar-art" aria-hidden="true">
          <i />
          <i />
          <i />
          <span />
          <b />
        </div>
        <div>
          <span className="eyebrow">PUBLIC-SOURCE WATCH</span>
          <h2>
            {civic.monitor.enabled
              ? "Watching while this workspace is open."
              : "A watch you control."}
          </h2>
          <p>
            Every 15 minutes while the app is open and visible. Public page
            changes create a review notice; they are not proof of a new project.
            The first successful check establishes a baseline.
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={civic.monitor.enabled}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  monitor: { ...c.monitor, enabled: e.target.checked },
                }))
              }
            />
            <span>
              Enable source monitoring and notices when local inputs change
            </span>
          </label>
          <small>
            Continuous monitoring after the browser closes requires a deployed
            scheduler. No email, push notification or automatic AI spend is
            enabled.
          </small>
        </div>
        <Button
          disabled={busy || !service.connected}
          onClick={() => void check()}
        >
          {busy ? "Checking public sources…" : "Check sources now"}
          <Icon name="sun" />
        </Button>
      </div>
      {(error || civic.monitor.lastError) && (
        <p role="alert" className="form-error agent-error">
          {error || civic.monitor.lastError}
        </p>
      )}
      <p className="micro">
        {service.message} · Last attempt:{" "}
        {civic.monitor.lastChecked
          ? new Date(civic.monitor.lastChecked).toLocaleString()
          : "No check recorded"}
      </p>
      <div className="monitor-layout">
        <section>
          <div className="civic-section-title">
            <div>
              <span className="eyebrow">
                CHANGES THAT DESERVE YOUR ATTENTION
              </span>
              <h2>The advisor inbox.</h2>
            </div>
            <span>{civic.notices.filter((n) => !n.read).length} unread</span>
          </div>
          {civic.notices.length ? (
            <div className="notice-list">
              {civic.notices.map((n) => (
                <article key={n.id} className={n.read ? "read" : ""}>
                  <span className="notice-marker" />
                  <div>
                    <span className="eyebrow">
                      {n.kind === "source"
                        ? "SOURCE UPDATE"
                        : n.kind === "report"
                          ? "RESIDENT INPUT"
                          : "RESEARCH UPDATE"}
                    </span>
                    <h3>{n.title}</h3>
                    <p>{n.detail}</p>
                    <small>{new Date(n.at).toLocaleString()}</small>
                    <div className="actions">
                      {n.href ? (
                        <a
                          className="quiet-link"
                          href={n.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Check the source ↗
                        </a>
                      ) : (
                        <Link
                          className="quiet-link"
                          to={`/community/${id}/${n.kind === "report" ? "reports" : "agents"}`}
                        >
                          Inspect the evidence <Icon size={15} />
                        </Link>
                      )}
                      {!n.read && (
                        <button
                          className="quiet-link"
                          onClick={() =>
                            change((c) => ({
                              ...c,
                              notices: c.notices.map((x) =>
                                x.id === n.id ? { ...x, read: true } : x,
                              ),
                            }))
                          }
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="civic-empty">
              <h3>Quiet, until something changes.</h3>
              <p>
                New submissions, completed runs and changed sources will appear
                here. No sample notifications are mixed with real activity.
              </p>
            </div>
          )}
        </section>
        <aside className="watchlist">
          <span className="eyebrow">THE EVIDENCE WATCHLIST</span>
          <h2>
            Known sources.
            <br />
            Visible status.
          </h2>
          {civic.monitor.snapshots.length ? (
            civic.monitor.snapshots.map((s) => (
              <article key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title} ↗
                </a>
                <span
                  className={`tag ${s.status === "ok" ? "positive" : "unknown"}`}
                >
                  {s.status === "ok"
                    ? "Baseline / content checked"
                    : "Unavailable"}
                </span>
                <small>{new Date(s.checkedAt).toLocaleString()}</small>
                {s.error && <p>{s.error}</p>}
              </article>
            ))
          ) : (
            <p>
              Run a source check to establish the current page fingerprints for
              the project library. No change will be announced without a
              previous successful baseline.
            </p>
          )}
          <Link className="quiet-link" to={`/community/${id}/agents`}>
            Research a new possibility <Icon size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
