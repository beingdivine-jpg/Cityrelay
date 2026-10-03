import { createClient } from "@supabase/supabase-js";
import type { AppState } from "./model";
import { seedState, validState } from "./storage";
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const sharedClient =
  url && key ? createClient(url, key, { auth: { flowType: "pkce" } }) : null;
export type SharedWorkspace = {
  id: string;
  name: string;
  owner_id: string;
  document: AppState;
  revision: number;
  public_intake: boolean;
  receiver: string;
  updated_at: string;
};
export function workspaceDocument(
  state: AppState,
  sourceId: string,
  targetId = sourceId,
): AppState {
  const p = state.profiles.find((p) => p.id === sourceId);
  if (!p) throw Error("Municipality not found");
  const result = seedState();
  result.profiles = [
    ...result.profiles.filter((p) => p.id !== targetId),
    { ...structuredClone(p), id: targetId },
  ];
  const plans = state.plans.filter((p) => p.communityId === sourceId);
  result.plans = plans.map((p) => ({
    ...structuredClone(p),
    id: `plan-${targetId}`,
    communityId: targetId,
    revisions: p.revisions?.map((r) => ({
      ...structuredClone(r),
      snapshot: r.snapshot
        ? {
            ...structuredClone(r.snapshot),
            id: `plan-${targetId}`,
            communityId: targetId,
          }
        : undefined,
    })),
  }));
  result.drafts = state.drafts
    .filter((d) => d.communityId === sourceId)
    .map((d) => ({ ...d, communityId: targetId }));
  result.outcomes = state.outcomes
    .filter((o) => plans.some((p) => p.id === o.planId))
    .map((o) => ({ ...o, planId: `plan-${targetId}` }));
  result.events = state.events
    .filter((e) => e.communityId === sourceId)
    .map((e) => ({ ...e, communityId: targetId }));
  const civic = state.civic?.[sourceId];
  if (civic)
    result.civic = {
      [targetId]: {
        ...structuredClone(civic),
        reports: [],
        notices: civic.notices.filter((n) => n.kind !== "report"),
      },
    };
  result.advisor = {
    name: state.advisor?.name || "Municipal advisor",
    role: "Municipal innovation advisor",
    entryMode: "own",
    activeCommunityId: targetId,
  };
  return result;
}
export function checkedWorkspace(value: unknown): SharedWorkspace {
  const w = value as SharedWorkspace;
  if (
    !w ||
    !validState(w.document) ||
    !w.id ||
    !Number.isSafeInteger(w.revision)
  )
    throw Error(
      "The shared workspace could not be read. No local data was replaced.",
    );
  return w;
}
