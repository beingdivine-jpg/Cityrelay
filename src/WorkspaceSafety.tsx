import { useState } from "react";
import { t as tr } from "./i18n";
import { Button, useApp } from "./components";
import { loadState, validState, STORAGE_KEY } from "./storage";
import SharedAccount from "./SharedAccount";
import { useShared } from "./SharedContext";
export default function WorkspaceSafety() {
  const shared = useShared();
  const { state, restoreState, notify } = useApp();
  const [error, setError] = useState("");
  const [backup, setBackup] = useState<typeof state | null>(null);
  const [unreadable] = useState(() => {
    try {
      return loadState().error ? localStorage.getItem(STORAGE_KEY) : null;
    } catch {
      return null;
    }
  });
  return (
    <div className="page-width safety-page">
      <span className="eyebrow">{tr("YOUR WORK, UNDER YOUR CONTROL")}</span>
      <h1>{tr("Account & backup")}</h1>
      <SharedAccount />
      {unreadable && !shared.workspace && (
        <section className="delivery-notice">
          <h2>{tr("Recover unreadable saved data")}</h2>
          <p>
            {tr(
              "The original saved file is preserved. Download it before resetting; it may be repairable and can contain private information.",
            )}
          </p>
          <a
            className="button"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(unreadable)}`}
            download="elsewhere-original-recovery.json"
          >
            {tr("Download original saved data")}
          </a>
        </section>
      )}
      {!shared.workspace && (
        <section className="delivery-notice">
          <h2>{tr("You are using a local preview")}</h2>
          <p>
            {tr(
              shared.user
                ? "You are signed in, but this workspace is local. Create a shared copy above when you are ready to collaborate."
                : "You are not signed in. Work stays in this browser and is not shared with a municipality or another device.",
            )}
          </p>
        </section>
      )}
      <section>
        <h2>{tr("Keep a complete copy")}</h2>
        <p>
          {tr(
            "Download your city profiles, reports, research and pilot drafts together. Store this file privately; it may contain information you entered.",
          )}
        </p>
        <a
          className="button"
          href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(state, null, 2))}`}
          download={`elsewhere-backup-${new Date().toISOString().slice(0, 10)}.json`}
        >
          {tr("Download workspace backup")}
        </a>
      </section>
      {!shared.workspace && (
        <>
          <section>
            <h2>{tr("Restore a backup")}</h2>
            <p>
              {tr(
                "The backup is validated before any change. Download your current work first; restoring replaces the local workspace.",
              )}
            </p>
            <label className="field">
              <span>{tr("Choose a workspace backup")}</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError("");
                  setBackup(null);
                  try {
                    if (file.size > 10_000_000) throw Error();
                    const parsed = JSON.parse(await file.text());
                    if (!validState(parsed)) throw Error();
                    setBackup(parsed);
                  } catch {
                    setError(
                      "This is not a valid Elsewhere workspace backup. Your current work is unchanged.",
                    );
                  }
                }}
              />
            </label>
            {backup && (
              <div className="delivery-notice">
                <p>
                  {tr("Ready to restore")}: {backup.profiles.length}{" "}
                  {tr("municipalities")} · {backup.plans.length}{" "}
                  {tr("pilot drafts")}
                </p>
                <div className="actions">
                  <Button
                    onClick={() => {
                      restoreState(backup);
                      setBackup(null);
                      notify("Workspace restored from backup.");
                    }}
                  >
                    {tr("Replace local workspace with this backup")}
                  </Button>
                  <button onClick={() => setBackup(null)}>
                    {tr("Cancel")}
                  </button>
                </div>
              </div>
            )}
            {error && <p role="alert">{tr(error)}</p>}
          </section>
          <section>
            <h2>{tr("Open the latest saved version")}</h2>
            <p>
              {tr(
                "If another tab changed this workspace, download your current copy before reloading the saved version.",
              )}
            </p>
            <Button
              secondary
              onClick={() => {
                const loaded = loadState();
                if (loaded.error) setError(loaded.error);
                else {
                  restoreState(loaded.state);
                  notify("Latest saved workspace loaded.");
                }
              }}
            >
              {tr("Reload saved work")}
            </Button>
          </section>
        </>
      )}
    </div>
  );
}
