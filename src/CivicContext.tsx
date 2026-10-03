import { useEffect, useRef, useState } from "react";
import { useApp } from "./components";
import { allowed, newCivic, runFingerprint } from "./civicEngine";
import { examples } from "./data";
import { getSource } from "./sources";
import type { CivicWorkspace, SourceSnapshot } from "./civicModel";
export function useCivic(id: string) {
  const { state, update } = useApp();
  const profile = state.profiles.find((p) => p.id === id);
  const civic = state.civic?.[id] || (profile ? newCivic(profile) : undefined);
  const change = (fn: (s: CivicWorkspace) => CivicWorkspace) =>
    update((s) => {
      const p = s.profiles.find((p) => p.id === id);
      if (!p) return s;
      return {
        ...s,
        civic: { ...s.civic, [id]: fn(s.civic?.[id] || newCivic(p)) },
      };
    });
  return { civic, change, profile };
}
export type ServiceStatus = {
  connected: boolean;
  ai: boolean;
  requiresAccount: boolean;
  backgroundMonitor?: boolean;
  model: string;
  message: string;
};
export function useAgentService() {
  const [status, setStatus] = useState<ServiceStatus>({
    connected: false,
    ai: false,
    requiresAccount: false,
    model: "",
    message: "Checking agent service…",
  });
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/status", { signal: abort.signal })
      .then(async (r) => {
        if (!r.ok) throw Error();
        const body = await r.json();
        if (typeof body.ai !== "boolean") throw Error();
        setStatus({
          connected: true,
          ai: body.ai,
          requiresAccount: body.requiresAccount === true,
          backgroundMonitor: body.backgroundMonitor === true,
          model: body.model,
          message:
            typeof body.message === "string"
              ? body.message
              : body.ai
                ? "Live AI research connected"
                : "Local engine connected · AI key not configured",
        });
      })
      .catch(() => {
        if (!abort.signal.aborted)
          setStatus({
            connected: false,
            ai: false,
            requiresAccount: false,
            model: "",
            message: "Local analysis available · Research service offline",
          });
      });
    return () => abort.abort();
  }, []);
  return status;
}
export async function checkSources(
  civic: CivicWorkspace,
): Promise<SourceSnapshot[]> {
  if (!allowed(civic, "catalogue"))
    throw Error("Share the project repository before monitoring its sources.");
  const sourceRecords = [...new Set(examples.flatMap((e) => e.sources))]
    .map(getSource)
    .filter((s) => !!s)
    .filter((s) => s.kind === "Municipal source" || s.kind === "Public agency")
    .filter((s) => !new URL(s.url).pathname.toLowerCase().endsWith(".pdf"));
  const r = await fetch("/api/monitor", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sources: sourceRecords.map((s) => ({ url: s.url, title: s.title })),
    }),
    signal: AbortSignal.timeout(50000),
  });
  if (!r.ok)
    throw Error(
      "Source checking is unavailable. Try again shortly; the service may be offline or at its request limit.",
    );
  const body = await r.json();
  if (!Array.isArray(body.snapshots))
    throw Error("The source checker returned an invalid response.");
  return body.snapshots;
}
export function applySnapshots(
  civic: CivicWorkspace,
  snapshots: SourceSnapshot[],
): CivicWorkspace {
  const now = new Date().toISOString();
  const notices = snapshots
    .filter(
      (s) =>
        s.status === "ok" &&
        civic.monitor.snapshots.some(
          (old) => old.url === s.url && old.hash && old.hash !== s.hash,
        ),
    )
    .map((s) => ({
      id: crypto.randomUUID(),
      title: "A watched source has changed",
      detail: `${s.title}. Its page content changed since the previous successful check. Review the source before treating this as a new idea.`,
      at: now,
      read: false,
      kind: "source" as const,
      href: s.url,
    }));
  const preserved = snapshots.map((s) =>
    s.status === "unavailable"
      ? {
          ...s,
          hash:
            civic.monitor.snapshots.find((old) => old.url === s.url)?.hash ||
            null,
        }
      : s,
  );
  return {
    ...civic,
    monitor: {
      ...civic.monitor,
      lastChecked: now,
      lastError: undefined,
      snapshots: preserved,
    },
    notices: [...notices, ...civic.notices].slice(0, 100),
  };
}
export function CivicMonitor({ id }: { id: string }) {
  const { civic, change, profile } = useCivic(id);
  const busy = useRef(false);
  const latest = useRef({ civic, change });
  latest.current = { civic, change };
  useEffect(() => {
    if (!civic?.monitor.enabled) return;
    const check = async () => {
      const current = latest.current;
      if (busy.current || document.hidden || !current.civic) return;
      busy.current = true;
      try {
        const snapshots = await checkSources(current.civic);
        latest.current.change((c) => applySnapshots(c, snapshots));
      } catch (e) {
        latest.current.change((c) => ({
          ...c,
          monitor: {
            ...c.monitor,
            lastError:
              e instanceof Error ? e.message : "Automatic source check failed.",
            lastChecked: new Date().toISOString(),
          },
        }));
      } finally {
        busy.current = false;
      }
    };
    const timer = setInterval(() => void check(), 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [id, civic?.monitor.enabled]);
  useEffect(() => {
    if (!profile || !civic?.monitor.enabled) return;
    const previous = civic.runs[0];
    if (
      previous &&
      previous.fingerprint !== runFingerprint(profile, civic) &&
      !civic.notices.some((n) => n.id === `stale-${previous.id}`)
    ) {
      change((c) => ({
        ...c,
        notices: [
          {
            id: `stale-${previous.id}`,
            title: "Your evidence changed",
            detail:
              "The municipal brief, shared data or resident reports changed after the last run. Re-run the agents before relying on its recommendations.",
            at: new Date().toISOString(),
            read: false,
            kind: "analysis" as const,
          },
          ...c.notices,
        ].slice(0, 100),
      }));
    }
  }, [profile, civic, change]);
  return null;
}
