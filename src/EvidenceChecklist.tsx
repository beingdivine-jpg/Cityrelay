import { useState } from "react";
import { t as tr, locale } from "./i18n";
import { Button, TextField, useApp } from "./components";
import type { CommunityProfile, MatchAssessment, LocalCheck } from "./model";
export default function EvidenceChecklist({
  profile,
  assessment,
}: {
  profile: CommunityProfile;
  assessment: MatchAssessment;
}) {
  const { saveProfile, notify } = useApp();
  const [editing, setEditing] = useState("");
  const [owner, setOwner] = useState("");
  const [evidence, setEvidence] = useState("");
  const [status, setStatus] = useState<LocalCheck["state"]>("unknown");
  const [error, setError] = useState("");
  return (
    <section className="evidence-checklist">
      <h3>{tr("Resolve the local questions")}</h3>
      <p>
        {tr(
          "Record who checked each condition and the evidence. These are advisor-recorded findings, not municipal approval.",
        )}
      </p>
      {assessment.readiness.map((check) => {
        const saved = profile.localChecks?.[assessment.example.id]?.[check.key];
        return (
          <div className="evidence-check" key={check.key}>
            <div>
              <strong>{tr(check.label)}</strong>
              <span
                className={`tag ${check.state === "met" ? "positive" : "unknown"}`}
              >
                {tr(check.state)}
              </span>
            </div>
            <p>{tr(check.explanation)}</p>
            {saved && (
              <small>
                {saved.owner} ·{" "}
                {new Date(saved.at).toLocaleDateString(locale())}
              </small>
            )}
            {editing === check.key ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!owner.trim() || evidence.trim().length < 20) {
                    setError(
                      "Add a responsible person and at least 20 characters of evidence.",
                    );
                    return;
                  }
                  saveProfile({
                    ...profile,
                    localChecks: {
                      ...profile.localChecks,
                      [assessment.example.id]: {
                        ...profile.localChecks?.[assessment.example.id],
                        [check.key]: {
                          state: status,
                          owner: owner.trim(),
                          evidence: evidence.trim(),
                          at: new Date().toISOString(),
                        },
                      },
                    },
                    updatedAt: new Date().toISOString(),
                  });
                  setEditing("");
                  notify(
                    "Evidence recorded. Run the analysis again to refresh your results.",
                  );
                }}
              >
                <label>
                  {tr("Finding")}
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as LocalCheck["state"])
                    }
                  >
                    <option value="unknown">{tr("Still investigating")}</option>
                    <option value="met">
                      {tr("Supported by local evidence")}
                    </option>
                    <option value="unmet">
                      {tr("Blocked by local evidence")}
                    </option>
                  </select>
                </label>
                <TextField
                  label={tr("Responsible person or team")}
                  value={owner}
                  onChange={setOwner}
                  required
                />
                <TextField
                  label={tr("Evidence, source and scope")}
                  value={evidence}
                  onChange={setEvidence}
                  multiline
                  required
                  hint={tr(
                    "Include a document reference or source, the proposed site and what was actually checked.",
                  )}
                />
                {error && <p role="alert">{tr(error)}</p>}
                <div className="actions">
                  <Button type="submit">{tr("Record finding")}</Button>
                  <button type="button" onClick={() => setEditing("")}>
                    {tr("Cancel")}
                  </button>
                </div>
              </form>
            ) : (
              <button
                className="quiet-link"
                onClick={() => {
                  setEditing(check.key);
                  setOwner(saved?.owner || "");
                  setEvidence(saved?.evidence || "");
                  setStatus(saved?.state || "unknown");
                  setError("");
                }}
              >
                {tr(saved ? "Update evidence" : "Add evidence")} ↗
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
