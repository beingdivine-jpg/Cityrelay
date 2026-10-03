import { createClient } from "@supabase/supabase-js";
import { sourceSnapshot } from "../server/agentService.mjs";
import sources from "../server/monitored-sources.json" with { type: "json" };
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET")
    return res.status(405).json({ error: "GET required" });
  const secret = process.env.CRON_SECRET,
    url = process.env.VITE_SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !url || !key)
    return res.status(200).json({ status: "not configured", checked: 0 });
  if (req.headers.authorization !== `Bearer ${secret}`)
    return res.status(401).json({ error: "Unauthorized" });
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  // Bounded batch; a production service can paginate this as usage grows.
  const { data: workspaces, error } = await db
    .from("ew_workspaces")
    .select("id,document")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error)
    return res.status(503).json({ error: "Workspace service unavailable" });
  const enabled = workspaces.filter(
    (w) =>
      w.document.civic?.[w.id]?.monitor.enabled &&
      w.document.civic?.[w.id]?.connections.some(
        (c) => c.key === "catalogue" && c.enabled,
      ),
  );
  if (!enabled.length) return res.status(200).json({ checked: 0 });
  const snapshots = await Promise.all(sources.map((s) => sourceSnapshot(s)));
  let saved = 0;
  for (const w of enabled) {
    const { data: old, error: readError } = await db
      .from("ew_monitor_results")
      .select("result")
      .eq("workspace_id", w.id)
      .maybeSingle();
    if (readError) continue;
    const previous = old?.result || { snapshots: [], notices: [] };
    const checkedAt = new Date().toISOString();
    const notices = snapshots
      .filter(
        (s) =>
          s.status === "ok" &&
          previous.snapshots.some(
            (p) => p.url === s.url && p.hash && p.hash !== s.hash,
          ),
      )
      .map((s) => ({
        id: `source:${s.sourceId || s.url}:${s.hash}`,
        title: "A watched source has changed",
        detail: `${s.title}. Review this source-page change before treating it as a new project.`,
        at: checkedAt,
        read: false,
        kind: "source",
        href: s.url,
      }));
    const result = {
      lastChecked: checkedAt,
      snapshots: snapshots.map((s) =>
        s.status === "unavailable"
          ? {
              ...s,
              hash:
                previous.snapshots.find((p) => p.url === s.url)?.hash || null,
            }
          : s,
      ),
      notices: [
        ...new Map(
          [...notices, ...previous.notices].map((n) => [n.id, n]),
        ).values(),
      ].slice(0, 100),
    };
    const { error } = await db
      .from("ew_monitor_results")
      .upsert({ workspace_id: w.id, result });
    if (!error) saved++;
  }
  return res
    .status(saved === enabled.length ? 200 : 503)
    .json({ checked: saved, requested: enabled.length });
}
