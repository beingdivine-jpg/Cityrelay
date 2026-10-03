import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { sharedClient } from "./shared";
import { t as tr, locale } from "./i18n";
import { Button, TextField } from "./components";
import { topicLabels } from "./civicEngine";
export default function SharedResident() {
  const { id } = useParams();
  const [place, setPlace] = useState<{ name: string; receiver: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState("complaint");
  const [topic, setTopic] = useState("unknown");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [area, setArea] = useState("");
  const [consent, setConsent] = useState(false);
  const [token, setToken] = useState("");
  const [receipt, setReceipt] = useState<{
    status: string;
    submitted_at: string;
    receiver: string;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    if (!sharedClient) {
      setLoading(false);
      return;
    }
    void sharedClient
      .rpc("ew_public_workspace", { w: id })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error)
          setError(
            "The reporting service could not be reached. Please try again.",
          );
        else setPlace(data?.[0] || null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);
  async function track(value = token) {
    if (!sharedClient) return;
    setBusy(true);
    setError("");
    const { data, error } = await sharedClient.rpc("ew_receipt", {
      token: value,
    });
    setBusy(false);
    if (error || !data?.length)
      setError(
        "No receipt was found. Check the complete reference and try again.",
      );
    else setReceipt(data[0]);
  }
  async function submit() {
    if (!sharedClient || busy) return;
    setError("");
    if (title.trim().length < 5 || detail.trim().length < 20) {
      setError(
        "Add a title of at least 5 characters and at least 20 characters describing the issue or idea.",
      );
      return;
    }
    setBusy(true);
    const { data, error } = await sharedClient.rpc("ew_submit", {
      w: id,
      p: { kind, topic, title, detail, area, externalConsent: consent },
    });
    setBusy(false);
    if (error) {
      setError("Your report was not delivered. Please try again later.");
      return;
    }
    setToken(data);
    setTitle("");
    setDetail("");
    await track(data);
  }
  return (
    <div className="page-width safety-page">
      <Link to="/">{tr("Elsewhere home")}</Link>
      <span className="eyebrow">{tr("RESIDENT REPORTING")}</span>
      <h1>{place?.name || tr("Resident space")}</h1>
      {loading ? (
        <p role="status">{tr("Loading workspace…")}</p>
      ) : (
        <>
          {!place ? (
            <p className="delivery-notice">
              {tr(
                "This reporting link is unavailable or has been closed by its owner. No report has been sent.",
              )}
            </p>
          ) : (
            <>
              <div className="delivery-notice">
                <strong>
                  {tr("Receiving team")}: {place.receiver}
                </strong>
                <p>
                  {tr(
                    "This team has enabled a shared inbox. Its municipal affiliation is self-declared. Reports are not emergency requests; no response time is guaranteed.",
                  )}
                </p>
              </div>
              {!receipt && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit();
                  }}
                >
                  <label>
                    {tr("Report type")}
                    <select
                      value={kind}
                      onChange={(e) => setKind(e.target.value)}
                    >
                      <option value="complaint">{tr("A concern")}</option>
                      <option value="idea">{tr("An idea")}</option>
                    </select>
                  </label>
                  <label>
                    {tr("Topic")}
                    <select
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      {Object.entries(topicLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {tr(label)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <TextField
                    label={tr("In a few words")}
                    value={title}
                    onChange={(v) => setTitle(v.slice(0, 150))}
                    required
                  />
                  <TextField
                    label={tr("Tell us a little more")}
                    value={detail}
                    onChange={(v) => setDetail(v.slice(0, 2000))}
                    multiline
                    required
                  />
                  <TextField
                    label={tr("Neighbourhood or public place (optional)")}
                    value={area}
                    onChange={(v) => setArea(v.slice(0, 100))}
                  />
                  <p>
                    {tr(
                      "Please leave out names, contact details and sensitive personal information.",
                    )}
                  </p>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    {tr(
                      "Allow this report’s text to be sent to OpenAI for municipal research if an advisor starts a live AI run. Optional; local processing works without this.",
                    )}
                  </label>
                  <Button type="submit" disabled={busy}>
                    {tr(busy ? "Sending…" : "Send to this team")}
                  </Button>
                </form>
              )}
            </>
          )}
          {receipt && (
            <section role="status">
              <h2>{tr("Delivered to the shared inbox")}</h2>
              <p>{receipt.receiver}</p>
              <strong>{tr(receipt.status)}</strong>
              <p>{new Date(receipt.submitted_at).toLocaleString(locale())}</p>
              <label>
                {tr("Keep this private reference to check progress")}
                <input
                  readOnly
                  value={token}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <p>
                {tr(
                  "Delivery is confirmed. Review and implementation are separate decisions made by the receiving team.",
                )}
              </p>
            </section>
          )}
          <details>
            <summary>{tr("Check a previous report")}</summary>
            <TextField
              label={tr("Complete receipt reference")}
              value={token}
              onChange={setToken}
            />
            <Button disabled={busy || !token} onClick={() => void track()}>
              {tr("Check status")}
            </Button>
          </details>
        </>
      )}
      {error && (
        <p role="alert" className="form-error">
          {tr(error)}
        </p>
      )}
    </div>
  );
}
