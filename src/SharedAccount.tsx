import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "./navigation";
import { t as tr } from "./i18n";
import { Button, TextField, useApp } from "./components";
import { sharedClient } from "./shared";
import { useShared } from "./SharedContext";
export default function SharedAccount() {
  const shared = useShared();
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [list, setList] = useState<{ id: string; name: string }[]>([]);
  const [publish, setPublish] = useState(false);
  const [city, setCity] = useState(
    state.advisor?.activeCommunityId === "krakow-demo"
      ? "krakow"
      : state.advisor?.activeCommunityId || "krakow",
  );
  const [receiver, setReceiver] = useState(shared.workspace?.receiver || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [access, setAccess] = useState<{
    members: { id: string; email: string; role: string }[];
    invitations: { id: string; email: string; expiresAt: string }[];
  } | null>(null);
  async function refreshAccess() {
    const { data, error } = await sharedClient!.rpc("ew_access", {
      w: shared.workspace!.id,
    });
    if (error) throw error;
    setAccess(data);
  }
  useEffect(() => {
    setPublish(shared.workspace?.public_intake || false);
    setReceiver(shared.workspace?.receiver || "");
  }, [shared.workspace?.id, shared.workspace?.public_intake]);
  const invitation = new URLSearchParams(location.search).get("invite");
  useEffect(() => {
    if (!sharedClient || !shared.user) return;
    void sharedClient
      .from("ew_workspaces")
      .select("id,name")
      .then(({ data, error }) => {
        if (error) setError("Shared workspaces could not be loaded.");
        else setList(data || []);
      });
  }, [shared.user?.id, shared.workspace?.id]);
  async function action(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The request failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!sharedClient)
    return (
      <section>
        <h2>{tr("Shared municipal workspaces")}</h2>
        <p>
          {tr(
            "Shared accounts are not connected on this deployment yet. You can explore locally and keep a backup. No account is implied.",
          )}
        </p>
      </section>
    );
  return (
    <section className="shared-account">
      <h2>{tr(shared.user ? "Your account" : "Sign in to collaborate")}</h2>
      {error && (
        <p role="alert" className="form-error">
          {tr(error)}
        </p>
      )}
      {notice && <p role="status">{tr(notice)}</p>}
      {!shared.user ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action(async () => {
              const { error } = await sharedClient!.auth.signInWithOtp({
                email: email.trim(),
                options: {
                  emailRedirectTo: `${window.location.origin}/account${invitation ? `?invite=${encodeURIComponent(invitation)}` : ""}`,
                },
              });
              if (error) throw error;
              setNotice(
                "Check your email for a secure sign-in link. This page does not need your password.",
              );
            });
          }}
        >
          <p>
            {tr(
              "Use your work email. Signing in does not verify that you represent a municipality.",
            )}
          </p>
          <label>
            {tr("Email address")}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={busy}>
            {tr("Email me a sign-in link")}
          </Button>
        </form>
      ) : (
        <>
          <p>
            {tr("Signed in as")} <strong>{shared.user.email}</strong> ·{" "}
            {tr("Municipal affiliation is self-declared")}
          </p>
          {invitation && (
            <Button
              disabled={busy}
              onClick={() =>
                void action(async () => {
                  const { data, error } = await sharedClient!.rpc("ew_accept", {
                    invitation,
                  });
                  if (error) throw error;
                  await shared.open(data);
                  navigate(`/community/${data}/challenge`);
                })
              }
            >
              {tr("Accept workspace invitation")}
            </Button>
          )}
          <div className="shared-list">
            {list.map((w) => (
              <Button
                secondary
                key={w.id}
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    await shared.open(w.id);
                    navigate(`/community/${w.id}/challenge`);
                  })
                }
              >
                {w.name} ↗
              </Button>
            ))}
          </div>
          {!shared.workspace && (
            <details>
              <summary>
                {tr("Create a shared workspace from a local city")}
              </summary>
              <p>
                {tr(
                  "This explicitly uploads the selected city profile, documents, research and pilot drafts to your shared account. Practice resident reports are excluded. Review your local data first.",
                )}
              </p>
              <label>
                {tr("Municipality")}
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  {state.profiles
                    .filter((p) => p.id !== "krakow-demo")
                    .map((p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </label>
              <Button
                disabled={busy}
                onClick={() =>
                  void action(async () => {
                    const id = await shared.create(state, city);
                    navigate(`/community/${id}/challenge`);
                  })
                }
              >
                {tr("Upload and create shared workspace")}
              </Button>
            </details>
          )}
          {shared.workspace && (
            <>
              <p>
                {tr("Current shared workspace")}:{" "}
                <strong>{shared.workspace.name}</strong>
              </p>
              <details>
                <summary>{tr("Recover from a save conflict")}</summary>
                <p>
                  {tr(
                    "Download your current edits from the backup section below before loading the shared version. Reloading replaces the unsaved view.",
                  )}
                </p>
                <Button
                  disabled={busy}
                  onClick={() =>
                    void action(async () => {
                      await shared.open(shared.workspace!.id, true);
                      setNotice("Latest shared version loaded.");
                    })
                  }
                >
                  {tr("Discard unsaved view and load shared version")}
                </Button>
              </details>
              <Button
                disabled={busy || shared.pending}
                secondary
                onClick={() =>
                  void action(async () => {
                    shared.leave();
                    navigate("/enter");
                  })
                }
              >
                {tr("Return to local exploration")}
              </Button>
              {shared.workspace.owner_id === shared.user.id && (
                <>
                  <details>
                    <summary>{tr("Invite an advisor")}</summary>
                    <p>
                      {tr(
                        "The invitation is restricted to this email and expires after seven days. Share the generated link yourself; no email is sent automatically.",
                      )}
                    </p>
                    <label>
                      {tr("Advisor email")}
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </label>
                    <Button
                      disabled={busy || !inviteEmail}
                      onClick={() =>
                        void action(async () => {
                          const { data, error } = await sharedClient!.rpc(
                            "ew_invite",
                            {
                              w: shared.workspace!.id,
                              recipient_email: inviteEmail,
                            },
                          );
                          if (error) throw error;
                          setInviteLink(
                            `${window.location.origin}/account?invite=${data}`,
                          );
                          await refreshAccess();
                        })
                      }
                    >
                      {tr("Create invitation link")}
                    </Button>
                    {inviteLink && (
                      <label>
                        {tr("Invitation link")}
                        <input
                          readOnly
                          value={inviteLink}
                          onFocus={(e) => e.target.select()}
                        />
                      </label>
                    )}
                  </details>
                  <details
                    onToggle={(e) => {
                      if (e.currentTarget.open) void action(refreshAccess);
                    }}
                  >
                    <summary>{tr("Team access")}</summary>
                    <p>
                      {tr(
                        "The owner can revoke an invitation or remove an advisor. Removed advisors cannot load or save this workspace again; copies they already downloaded cannot be recalled.",
                      )}
                    </p>
                    {access &&
                      [
                        ...access.members.map((m) => ({
                          ...m,
                          kind: "member",
                        })),
                        ...access.invitations.map((i) => ({
                          ...i,
                          role: "pending",
                          kind: "invitation",
                        })),
                      ].map((person) => (
                        <div
                          className="access-row"
                          key={person.kind + person.id}
                        >
                          <span>
                            {person.email} ·{" "}
                            {tr(
                              person.role === "owner"
                                ? "Owner"
                                : person.role === "pending"
                                  ? "Invitation pending"
                                  : "Advisor",
                            )}
                          </span>
                          {person.role !== "owner" && (
                            <Button
                              secondary
                              disabled={busy}
                              onClick={() =>
                                void action(async () => {
                                  const { error } = await sharedClient!.rpc(
                                    "ew_revoke",
                                    {
                                      w: shared.workspace!.id,
                                      target: person.id,
                                      kind: person.kind,
                                    },
                                  );
                                  if (error) throw error;
                                  setInviteLink("");
                                  await refreshAccess();
                                  setNotice("Access revoked.");
                                })
                              }
                            >
                              {tr("Revoke access")}
                            </Button>
                          )}
                        </div>
                      ))}
                  </details>
                  <details>
                    <summary>{tr("Resident reporting link")}</summary>
                    <p>
                      {tr(
                        "Enable a public form only if your team will review incoming reports. The receiver is self-declared; this does not certify an official municipal service.",
                      )}
                    </p>
                    <TextField
                      label={tr("Receiving team")}
                      value={receiver}
                      onChange={setReceiver}
                    />
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={publish}
                        onChange={(e) => setPublish(e.target.checked)}
                      />
                      {tr("Enable public resident intake")}
                    </label>
                    <Button
                      disabled={busy || shared.pending}
                      onClick={() =>
                        void action(async () => {
                          const { error } = await sharedClient!.rpc(
                            "ew_publish",
                            {
                              w: shared.workspace!.id,
                              enabled: publish,
                              receiver_name: receiver,
                            },
                          );
                          if (error) throw error;
                          await shared.open(shared.workspace!.id);
                          setNotice(
                            publish
                              ? "Resident reporting is enabled."
                              : "Resident reporting is disabled.",
                          );
                        })
                      }
                    >
                      {tr("Save reporting settings")}
                    </Button>
                    {shared.workspace.public_intake && (
                      <a
                        href={`/resident/${shared.workspace.id}`}
                      >{`${window.location.origin}/resident/${shared.workspace.id}`}</a>
                    )}
                  </details>
                </>
              )}
            </>
          )}
          <Button
            secondary
            disabled={shared.pending || busy}
            onClick={() =>
              void action(async () => {
                const { error } = await sharedClient!.auth.signOut();
                if (error) throw error;
                navigate("/account");
              })
            }
          >
            {tr("Sign out")}
          </Button>
          {shared.pending && (
            <p>
              {tr(
                "Save your shared changes before switching workspaces or signing out.",
              )}
            </p>
          )}
        </>
      )}
    </section>
  );
}
