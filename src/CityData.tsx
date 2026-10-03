import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button, CommunityNav, Icon, TextField } from "./components";
import { useCivic } from "./CivicContext";
import { datasetLabels } from "./civicEngine";
import { Missing } from "./Workspace";
import { SourceList } from "./SourceList";
import type { CivicWorkspace } from "./civicModel";
export default function CityData() {
  const { id = "" } = useParams();
  const { profile, civic, change } = useCivic(id);
  const [name, setName] = useState(""),
    [department, setDepartment] = useState(""),
    [docTitle, setDocTitle] = useState(""),
    [text, setText] = useState(""),
    [owner, setOwner] = useState("lead"),
    [external, setExternal] = useState(false),
    [error, setError] = useState("");
  if (!profile || !civic) return <Missing />;
  async function readFile(file?: File) {
    setError("");
    if (!file) return;
    if (!file.name.endsWith(".txt") || file.size > 100 * 1024) {
      setError("Choose a plain-text .txt file up to 100 KB.");
      return;
    }
    try {
      const value = await file.text();
      if (value.includes("\0")) throw Error();
      setText(value.slice(0, 30000));
      setDocTitle(file.name);
    } catch {
      setError("Could not read the text file.");
    }
  }
  return (
    <div className="page-width civic-page">
      <CommunityNav profile={profile} />
      <div className="civic-heading">
        <div>
          <span className="eyebrow">
            01 / GIVE THE AGENTS A LOCAL FOUNDATION
          </span>
          <h1>
            Shared knowledge.
            <br />
            <span className="blue-text">Clear permission.</span>
          </h1>
        </div>
        <p>
          Different advisors see different parts of the city. Bring that
          knowledge together and choose exactly what the research workflow can
          use.
        </p>
      </div>
      <div className="data-authority">
        <div>
          <span className="eyebrow">WHO IS THIS WORKSPACE FOR?</span>
          <h2>Start with the authority.</h2>
          <p>
            A city name and a responsible public body are different things.
            Record the organisation that would review a proposal.
          </p>
        </div>
        <div className="authority-form">
          <label className="field">
            Authority type
            <select
              value={civic.authority.kind}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  authority: {
                    ...c.authority,
                    kind: e.target.value as CivicWorkspace["authority"]["kind"],
                    confirmed: false,
                  },
                }))
              }
            >
              {[
                "Municipality",
                "City council",
                "Regional authority",
                "Public agency",
              ].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <TextField
            label="Responsible organisation"
            value={civic.authority.name}
            onChange={(v) =>
              change((c) => ({
                ...c,
                authority: {
                  ...c.authority,
                  name: v.slice(0, 160),
                  confirmed: false,
                },
              }))
            }
            placeholder="The municipality, council or public agency"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={civic.authority.confirmed}
              disabled={!civic.authority.name.trim()}
              onChange={(e) =>
                change((c) => ({
                  ...c,
                  authority: { ...c.authority, confirmed: e.target.checked },
                }))
              }
            />
            <span>
              I have checked this authority profile for this workspace.
            </span>
          </label>
          <small>
            {civic.authority.confirmed
              ? "Confirmed by the advisor. This does not verify institutional membership."
              : "A typed organisation name is not institutional verification."}
          </small>
        </div>
      </div>
      <section className="data-section">
        <div className="civic-section-title">
          <div>
            <span className="eyebrow">THE PEOPLE BEHIND THE CONTEXT</span>
            <h2>Your municipal team.</h2>
          </div>
          <span className="tag">
            Local role planning · no account invitations
          </span>
        </div>
        <div className="contributor-grid">
          {civic.contributors.map((c) => (
            <article key={c.id}>
              <span className="contributor-avatar">
                {c.name.slice(0, 2).toUpperCase()}
              </span>
              <div>
                <h3>{c.name}</h3>
                <p>{c.department}</p>
                <small>{c.role}</small>
              </div>
            </article>
          ))}
        </div>
        <form
          className="contributor-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !department.trim()) return;
            change((c) => ({
              ...c,
              contributors: [
                ...c.contributors,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  department: department.trim(),
                  role: "Contributing advisor",
                },
              ],
            }));
            setName("");
            setDepartment("");
          }}
        >
          <TextField
            label="Advisor name or role"
            value={name}
            onChange={setName}
            required
            placeholder="e.g. Climate advisor"
          />
          <TextField
            label="Team / department"
            value={department}
            onChange={setDepartment}
            required
            placeholder="e.g. Environment team"
          />
          <Button type="submit">
            Add contributor <Icon name="plus" />
          </Button>
        </form>
        <p className="micro">
          Contributors and ownership are recorded locally. Separate
          authenticated users and cross-device access are not connected in this
          preview.
        </p>
      </section>
      <section className="data-section">
        <div className="civic-section-title">
          <div>
            <span className="eyebrow">SHARE ONLY WHAT THE AGENTS NEED</span>
            <h2>The data room.</h2>
          </div>
          <Link className="quiet-link" to={`/start?edit=${id}`}>
            Edit municipal context <Icon name="edit" size={16} />
          </Link>
        </div>
        <div className="connection-table">
          {civic.connections.map((c) => (
            <div key={c.key}>
              <div className={`connection-icon ${c.enabled ? "enabled" : ""}`}>
                <Icon
                  name={
                    c.key === "reports"
                      ? "chat"
                      : c.key === "catalogue"
                        ? "book"
                        : c.key === "resources"
                          ? "leaf"
                          : "pin"
                  }
                  size={23}
                />
              </div>
              <div>
                <h3>{datasetLabels[c.key]}</h3>
                <p>
                  {c.key === "reports"
                    ? `${civic.reports.length} submitted reports · reporter consent required for external AI`
                    : c.key === "context"
                      ? `${profile.existingInitiatives.length} initiatives · ${civic.documents.filter((d) => d.enabled).length} shared local documents`
                      : c.key === "resources"
                        ? "Available assets, budget band and staff availability"
                        : "5 documented city projects · primary source links"}
                </p>
              </div>
              <label className="connection-owner">
                Data steward
                <select
                  aria-label={`Data steward for ${datasetLabels[c.key]}`}
                  value={c.ownerId}
                  onChange={(e) =>
                    change((s) => ({
                      ...s,
                      connections: s.connections.map((x) =>
                        x.key === c.key ? { ...x, ownerId: e.target.value } : x,
                      ),
                    }))
                  }
                >
                  {civic.contributors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sharing-toggle">
                <input
                  type="checkbox"
                  checked={c.enabled}
                  onChange={(e) =>
                    change((s) => ({
                      ...s,
                      connections: s.connections.map((x) =>
                        x.key === c.key
                          ? { ...x, enabled: e.target.checked }
                          : x,
                      ),
                    }))
                  }
                />
                <span>{c.enabled ? "Shared" : "Withheld"}</span>
              </label>
            </div>
          ))}
        </div>
        <p className="micro">
          These switches control inputs to new analysis runs. They are workflow
          permissions, not authenticated access control. Previously recorded run
          outputs remain in the audit history.
        </p>
      </section>
      <section className="data-section document-room">
        <div>
          <span className="eyebrow">LOCAL KNOWLEDGE, WITH AN OWNER</span>
          <h2>
            Add the context
            <br />
            only your team knows.
          </h2>
          <p>
            A policy note, a resource constraint or an existing initiative.
            Local contributions remain advisor-supplied evidence.
          </p>
          {profile.sources?.length ? (
            <details className="data-source-details">
              <summary>
                Published context already available{" "}
                <Icon name="plus" size={16} />
              </summary>
              <SourceList ids={profile.sources} compact />
            </details>
          ) : null}
        </div>
        <form
          className="document-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!docTitle.trim() || text.trim().length < 10) {
              setError("Add a title and at least 10 characters of context.");
              return;
            }
            change((c) => ({
              ...c,
              documents: [
                ...c.documents,
                {
                  id: crypto.randomUUID(),
                  title: docTitle.trim(),
                  ownerId: owner,
                  text: text.trim().slice(0, 30000),
                  enabled: true,
                  externalConsent: external,
                  createdAt: new Date().toISOString(),
                },
              ],
            }));
            setDocTitle("");
            setText("");
            setError("");
          }}
        >
          <TextField
            label="Document title"
            value={docTitle}
            onChange={setDocTitle}
            required
          />
          <label className="field">
            Contributing advisor
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {civic.contributors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} / {c.department}
                </option>
              ))}
            </select>
          </label>
          <TextField
            label="Local context"
            value={text}
            onChange={(v) => setText(v.slice(0, 30000))}
            required
            multiline
          />
          <label className="document-upload">
            Or import a .txt file{" "}
            <input
              type="file"
              accept=".txt,text/plain"
              onChange={(e) => void readFile(e.target.files?.[0])}
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={external}
              onChange={(e) => setExternal(e.target.checked)}
            />
            <span>
              Allow this document’s text to be sent to OpenAI when an advisor
              starts live AI research.
            </span>
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <Button type="submit">
            Add to the data room <Icon name="plus" />
          </Button>
        </form>
      </section>
      {civic.documents.length > 0 && (
        <div className="document-list">
          {civic.documents.map((d) => (
            <article key={d.id}>
              <div>
                <span className="eyebrow">
                  LOCAL CONTRIBUTION /{" "}
                  {civic.contributors.find((c) => c.id === d.ownerId)?.name}
                </span>
                <h3>{d.title}</h3>
                <p>
                  {d.text.slice(0, 260)}
                  {d.text.length > 260 ? "…" : ""}
                </p>
                <small>
                  {d.externalConsent
                    ? "Permitted for external AI runs"
                    : "Local processing only"}{" "}
                  · {new Date(d.createdAt).toLocaleDateString()}
                </small>
              </div>
              <label className="sharing-toggle">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) =>
                    change((c) => ({
                      ...c,
                      documents: c.documents.map((x) =>
                        x.id === d.id ? { ...x, enabled: e.target.checked } : x,
                      ),
                    }))
                  }
                />
                <span>{d.enabled ? "Shared" : "Withheld"}</span>
              </label>
            </article>
          ))}
        </div>
      )}
      <div className="civic-next">
        <p>
          {civic.authority.confirmed
            ? "The local foundation is ready. Collect resident input or begin a research run."
            : "Confirm the responsible authority to complete the first step."}
        </p>
        <Button to={`/community/${id}/agents`}>
          Continue to the agent studio <Icon />
        </Button>
      </div>
    </div>
  );
}
