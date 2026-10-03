import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  checkedWorkspace,
  sharedClient,
  workspaceDocument,
  type SharedWorkspace,
} from "./shared";
import type { AppState } from "./model";
import type { CivicReport } from "./civicModel";
import { useLocation } from "react-router-dom";
import { loadState } from "./storage";
import { newCivic } from "./civicEngine";
const SharedContext = createContext<ReturnType<typeof useSharedState>>(
  {} as never,
);
function useSharedState() {
  const location = useLocation();
  const [opening, setOpening] = useState(false);
  const [background, setBackground] = useState<{
    lastChecked: string;
    snapshots: import("./civicModel").SourceSnapshot[];
    notices: import("./civicModel").CivicNotice[];
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null);
  const [draft, setDraft] = useState<AppState | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState(false);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const generation = useRef(0);
  const current = useRef({ workspace, draft, pending });
  current.current = { workspace, draft, pending };
  useEffect(() => {
    if (!sharedClient) return;
    void sharedClient.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = sharedClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        generation.current++;
        setWorkspace(null);
        setDraft(null);
        setPending(false);
        setSaving(false);
        setReports([]);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);
  async function refreshReports(id: string) {
    if (!sharedClient) return;
    const { data, error } = await sharedClient
      .from("ew_reports")
      .select("id,payload,status,submitted_at")
      .eq("workspace_id", id)
      .order("submitted_at", { ascending: false });
    if (error) {
      setError("Resident reports could not be refreshed. Try again.");
      return;
    }
    if (current.current.workspace?.id !== id) return;
    const monitor = await sharedClient
      .from("ew_monitor_results")
      .select("result")
      .eq("workspace_id", id)
      .maybeSingle();
    if (current.current.workspace?.id !== id) return;
    if (monitor.data) setBackground(monitor.data.result);
    setReports(
      (data || [])
        .filter((r) => r.status !== "closed")
        .map((r) => ({
          ...r.payload,
          id: r.id,
          submittedAt: r.submitted_at,
          status:
            r.status === "received" || r.status === "reviewed"
              ? "received"
              : "needs-review",
        })),
    );
  }
  useEffect(() => {
    if (!workspace) return;
    void refreshReports(workspace.id);
    const timer = setInterval(() => {
      if (!document.hidden) void refreshReports(workspace.id);
    }, 15000);
    return () => clearInterval(timer);
  }, [workspace?.id]);
  async function open(id: string, discard = false) {
    if (!sharedClient) throw Error("Shared service is not configured");
    if (current.current.pending && !discard)
      throw Error(
        "Save or download your pending edits before switching workspaces.",
      );
    const request = ++generation.current;
    setOpening(true);
    const { data, error } = await sharedClient
      .from("ew_workspaces")
      .select("*")
      .eq("id", id)
      .single();
    setOpening(false);
    if (error)
      throw Error(
        "This workspace is unavailable or your account does not have access.",
      );
    const w = checkedWorkspace(data);
    if (request !== generation.current) return;
    setWorkspace(w);
    setDraft(w.document);
    setReports([]);
    setBackground(null);
    setPending(false);
    setError("");
  }
  useEffect(() => {
    const id = location.pathname.match(/^\/community\/([^/]+)/)?.[1];
    if (
      user &&
      !workspace &&
      id &&
      !loadState().state.profiles.some((p) => p.id === id)
    )
      void open(id).catch((e) => setError(e.message));
  }, [user?.id, location.pathname]);
  function update(fn: (s: AppState) => AppState) {
    setDraft((s) => {
      if (!s) return s;
      return fn(s);
    });
    setPending(true);
  }
  async function save() {
    const { workspace: w, draft: d } = current.current;
    if (!w || !d || !sharedClient || saving) return;
    setSaving(true);
    setError("");
    const request = generation.current;
    const snapshot = d;
    try {
      const { data, error } = await sharedClient.rpc("ew_save", {
        w: w.id,
        expected_revision: w.revision,
        d: workspaceDocument(snapshot, w.id),
      });
      if (request !== generation.current) return;
      setSaving(false);
      if (error) {
        setError(
          error.message.includes("SAVE_CONFLICT")
            ? "Another advisor saved changes first. Download your edits, then reload the shared version. Your edits have not been overwritten."
            : "The shared save failed. Your edits are still open; download a backup before leaving.",
        );
        return;
      }
      const next = checkedWorkspace(data);
      setWorkspace(next);
      if (current.current.draft === snapshot) setPending(false);
    } catch {
      if (request === generation.current)
        setError(
          "The shared save failed. Your edits are still open; download a backup before leaving.",
        );
    } finally {
      if (request === generation.current) setSaving(false);
    }
  }
  useEffect(() => {
    if (!pending) return;
    const leave = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [pending]);
  async function create(state: AppState, id: string) {
    if (!sharedClient) throw Error("Shared service is not configured");
    if (current.current.pending)
      throw Error(
        "Save or download your pending edits before switching workspaces.",
      );
    const target = crypto.randomUUID();
    const document = workspaceDocument(state, id, target);
    const { data, error } = await sharedClient.rpc("ew_create", {
      w: target,
      n: document.profiles.find((p) => p.id === target)!.name,
      d: document,
    });
    if (error) throw Error(error.message);
    const w = checkedWorkspace(data);
    generation.current++;
    setWorkspace(w);
    setDraft(w.document);
    setPending(false);
    setReports([]);
    setBackground(null);
    return w.id;
  }
  function leave() {
    if (pending)
      throw Error(
        "Save or download your pending edits before leaving this workspace.",
      );
    generation.current++;
    setWorkspace(null);
    setDraft(null);
    setReports([]);
    setError("");
  }
  const state =
    draft && workspace
      ? {
          ...draft,
          advisor: {
            ...draft.advisor!,
            name: user?.email || "Municipal advisor",
            activeCommunityId: workspace.id,
          },
          civic: {
            ...draft.civic,
            [workspace.id]: {
              ...(draft.civic?.[workspace.id] ||
                newCivic(draft.profiles.find((p) => p.id === workspace.id)!)),
              reports,
              ...(background
                ? {
                    monitor: {
                      ...(
                        draft.civic?.[workspace.id] ||
                        newCivic(
                          draft.profiles.find((p) => p.id === workspace.id)!,
                        )
                      ).monitor,
                      snapshots: background.snapshots,
                      lastChecked: background.lastChecked,
                    },
                    notices: [
                      ...new Map(
                        [
                          ...background.notices,
                          ...(draft.civic?.[workspace.id]?.notices || []),
                        ].map((n) => [n.id, n]),
                      ).values(),
                    ],
                  }
                : {}),
            },
          },
        }
      : null;
  return {
    user,
    workspace,
    opening,
    state,
    error,
    saving,
    pending,
    open,
    update,
    save,
    create,
    leave,
    refreshReports,
  };
}
export function SharedProvider({ children }: { children: ReactNode }) {
  const shared = useSharedState();
  return (
    <SharedContext.Provider value={shared}>{children}</SharedContext.Provider>
  );
}
export const useShared = () => useContext(SharedContext);
