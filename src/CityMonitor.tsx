import { useShared } from "./SharedContext";
import { t as tr, locale } from "./i18n";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Link } from "./navigation";
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
  const shared = useShared();
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
          <span className="eyebrow">
            {tr("KEEP YOUR LOCAL KNOWLEDGE CONNECTED")}
          </span>
          <h1>
            {tr("The world moves.")}
            <br />
            <span className="blue-text">{tr("Stay in the loop.")}</span>
          </h1>
        </div>
        <p>
          {tr(
            "Monitor documented public sources, notice changes in your municipal inputs and bring promising developments back for advisor review.",
          )}
        </p>
      </div>
      <p className="delivery-notice">
        {tr(
          "Coverage: the approved source pages in our curated library. This is a page-change watch, not a global discovery feed.",
        )}
      </p>
      {shared.workspace && service.backgroundMonitor && (
        <p className="agent-notice">
          {tr(
            "Daily background source checks are connected. Save your monitoring choice to apply it after the browser closes.",
          )}
        </p>
      )}
      <div className="monitor-control">
        <div className="radar-art" aria-hidden="true">
          <i />
          <i />
          <i />
          <span />
          <b />
        </div>
        <div>
          <span className="eyebrow">{tr("PUBLIC-SOURCE WATCH")}</span>
          <h2>
            {tr(
              civic.monitor.enabled
                ? "Watching while this workspace is open."
                : "A watch you control.",
            )}
          </h2>
          <p>
            {tr(
              "Every 15 minutes while the app is open and visible. Public page changes create a review notice; they are not proof of a new project. The first successful check establishes a baseline.",
            )}
          </p>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={civic.monitor.enabled}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  monitor: {
                    ...c.monitor,
                    enabled: e.target.checked,
                  },
                }))
              }
            />
            <span>
              {tr(
                "Enable source monitoring and notices when local inputs change",
              )}
            </span>
          </label>
          <small>
            {tr(
              shared.workspace && service.backgroundMonitor
                ? "Daily checks continue for this shared workspace. No email, push notification or automatic AI spend is enabled."
                : "Continuous monitoring after the browser closes requires a deployed scheduler. No email, push notification or automatic AI spend is enabled.",
            )}
          </small>
        </div>
        <Button
          disabled={busy || !service.connected}
          onClick={() => void check()}
        >
          {tr(busy ? "Checking public sources…" : "Check sources now")}
          <Icon name="sun" />
        </Button>
      </div>
      {tr(
        (error || civic.monitor.lastError) && (
          <p role="alert" className="form-error agent-error">
            {tr(error || civic.monitor.lastError)}
          </p>
        ),
      )}
      <p className="micro">
        {tr(service.message)}
        {tr(" · Last attempt:")}
        {tr(" ")}
        {tr(
          civic.monitor.lastChecked
            ? new Date(civic.monitor.lastChecked).toLocaleString(locale())
            : "No check recorded",
        )}
      </p>
      <div className="monitor-layout">
        <section>
          <div className="civic-section-title">
            <div>
              <span className="eyebrow">
                {tr("CHANGES THAT DESERVE YOUR ATTENTION")}
              </span>
              <h2>{tr("The advisor inbox.")}</h2>
            </div>
            <span>
              {tr(civic.notices.filter((n) => !n.read).length)}
              {tr(" unread")}
            </span>
          </div>
          {tr(
            civic.notices.length ? (
              <div className="notice-list">
                {tr(
                  civic.notices.map((n) => (
                    <article key={n.id} className={n.read ? "read" : ""}>
                      <span className="notice-marker" />
                      <div>
                        <span className="eyebrow">
                          {tr(
                            n.kind === "source"
                              ? "SOURCE UPDATE"
                              : n.kind === "report"
                                ? "RESIDENT INPUT"
                                : "RESEARCH UPDATE",
                          )}
                        </span>
                        <h3>{tr(n.title)}</h3>
                        <p>{tr(n.detail)}</p>
                        <small>
                          {tr(new Date(n.at).toLocaleString(locale()))}
                        </small>
                        <div className="actions">
                          {tr(
                            n.href ? (
                              <a
                                className="quiet-link"
                                href={n.href}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {tr("Check the source ↗")}
                              </a>
                            ) : (
                              <Link
                                className="quiet-link"
                                to={`/community/${id}/${n.kind === "report" ? "reports" : "agents"}`}
                              >
                                {tr("Inspect the evidence ")}
                                <Icon size={15} />
                              </Link>
                            ),
                          )}
                          {tr(
                            !n.read && (
                              <button
                                className="quiet-link"
                                onClick={() =>
                                  change((c) => ({
                                    ...c,
                                    notices: c.notices.map((x) =>
                                      x.id === n.id
                                        ? {
                                            ...x,
                                            read: true,
                                          }
                                        : x,
                                    ),
                                  }))
                                }
                              >
                                {tr("Mark read")}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                    </article>
                  )),
                )}
              </div>
            ) : (
              <div className="civic-empty">
                <h3>{tr("Quiet, until something changes.")}</h3>
                <p>
                  {tr(
                    "New submissions, completed runs and changed sources will appear here. No sample notifications are mixed with real activity.",
                  )}
                </p>
              </div>
            ),
          )}
        </section>
        <aside className="watchlist">
          <span className="eyebrow">{tr("THE EVIDENCE WATCHLIST")}</span>
          <h2>
            {tr("Known sources.")}
            <br />
            {tr("Visible status.")}
          </h2>
          {tr(
            civic.monitor.snapshots.length ? (
              civic.monitor.snapshots.map((s) => (
                <article key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {tr(s.title)}
                    {tr(" ↗")}
                  </a>
                  <span
                    className={`tag ${s.status === "ok" ? "positive" : "unknown"}`}
                  >
                    {tr(
                      s.status === "ok"
                        ? "Baseline / content checked"
                        : "Unavailable",
                    )}
                  </span>
                  <small>
                    {tr(new Date(s.checkedAt).toLocaleString(locale()))}
                  </small>
                  {tr(s.error && <p>{tr(s.error)}</p>)}
                  {s.excerpt && (
                    <details>
                      <summary>
                        {tr("Inspect the checked source excerpt")}
                      </summary>
                      <p className="source-excerpt">{s.excerpt}</p>
                      <small>
                        {tr(
                          "Source text is preserved in its original language. A changed page still needs human review.",
                        )}
                      </small>
                    </details>
                  )}
                </article>
              ))
            ) : (
              <p>
                {tr(
                  "Run a source check to establish the current page fingerprints for the project library. No change will be announced without a previous successful baseline.",
                )}
              </p>
            ),
          )}
          <Link className="quiet-link" to={`/community/${id}/agents`}>
            {tr("Research a new possibility ")}
            <Icon size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
