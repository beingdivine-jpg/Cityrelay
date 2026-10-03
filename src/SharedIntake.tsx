import { useEffect, useState } from "react";
import { t as tr, locale } from "./i18n";
import { sharedClient } from "./shared";
import { useShared } from "./SharedContext";
import { Button, CommunityNav, useApp } from "./components";
import type { CivicReport } from "./civicModel";
export default function SharedIntake() {
  const shared = useShared();
  const { state } = useApp();
  const [reports, setReports] = useState<
    { id: string; payload: CivicReport; status: string; submitted_at: string }[]
  >([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const w = shared.workspace;
  const profile = state.profiles.find((p) => p.id === w?.id);
  async function refresh() {
    if (!sharedClient || !w) return;
    const { data, error } = await sharedClient
      .from("ew_reports")
      .select("id,payload,status,submitted_at")
      .eq("workspace_id", w.id)
      .order("submitted_at", { ascending: false });
    if (error) setError("Resident reports could not be refreshed. Try again.");
    else setReports(data || []);
  }
  useEffect(() => {
    void refresh();
  }, [w?.id]);
  if (!w || !profile) return null;
  async function review(id: string, status: string) {
    setBusy(true);
    setError("");
    const { error } = await sharedClient!.rpc("ew_review_report", {
      r: id,
      next_status: status,
    });
    if (error) setError("The report status could not be saved.");
    else {
      await refresh();
      await shared.refreshReports(w!.id);
    }
    setBusy(false);
  }
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <h1>{tr("Resident inbox")}</h1>
      <p>
        {tr(
          "New submissions are held for intake review. Check personal information and relevance before including them in research.",
        )}
      </p>
      <Button secondary onClick={() => void refresh()}>
        {tr("Refresh inbox")}
      </Button>
      {error && <p role="alert">{tr(error)}</p>}
      {!reports.length && (
        <div className="civic-empty">
          <h2>{tr("No reports have arrived yet.")}</h2>
          <p>
            {tr(
              "Enable your reporting link in Account & backup, then share it with residents.",
            )}
          </p>
        </div>
      )}
      {reports.map((r) => (
        <article className="research-lead" key={r.id}>
          <span>
            {tr(r.status)} · {new Date(r.submitted_at).toLocaleString(locale())}
          </span>
          <h2>{r.payload.title}</h2>
          <p>{r.payload.detail}</p>
          <p>{r.payload.area}</p>
          <div className="actions">
            <Button
              disabled={busy}
              onClick={() => void review(r.id, "received")}
            >
              {tr("Include in local analysis")}
            </Button>
            <Button
              disabled={busy}
              secondary
              onClick={() => void review(r.id, "needs-review")}
            >
              {tr("Hold for intake review")}
            </Button>
            <button disabled={busy} onClick={() => void review(r.id, "closed")}>
              {tr("Close report")}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
