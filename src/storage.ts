import { validCivic } from "./civicStorage";
import { assetLabels, budgetLabels, seedProfiles, staffLabels } from "./data";
import type { AppState } from "./model";
export const STORAGE_KEY = "cityrelay.real.v2";
export const seedState = (): AppState => ({
  version: 2,
  profiles: structuredClone(seedProfiles),
  events: [],
  plans: [],
  outcomes: [],
  drafts: [],
});
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const strings = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");
const fields = (v: unknown, keys: string[]) =>
  object(v) && keys.every((key) => typeof v[key] === "string");
const validPlan = (p: unknown): boolean =>
  object(p) &&
  fields(p, [
    "id",
    "communityId",
    "goal",
    "retainedInitiatives",
    "adaptations",
    "prerequisites",
    "roleAssignments",
    "schedule",
    "reviewStatus",
    "proposal",
  ]) &&
  strings(p.selectedExamples) &&
  strings(p.metrics);
export function validState(data: unknown): data is AppState {
  if (
    !object(data) ||
    data.version !== 2 ||
    !["profiles", "events", "plans", "outcomes", "drafts"].every((key) =>
      Array.isArray(data[key]),
    )
  )
    return false;
  const { profiles, events, plans, outcomes, drafts } =
    data as unknown as AppState;
  return (
    (data.civic === undefined || validCivic(data.civic)) &&
    (!data.advisor ||
      (fields(data.advisor, [
        "name",
        "role",
        "activeCommunityId",
        "entryMode",
      ]) &&
        ["guided", "own"].includes(
          (data.advisor as Record<string, string>).entryMode,
        ) &&
        profiles.some(
          (p) =>
            p?.id ===
            (data.advisor as Record<string, string>).activeCommunityId,
        ))) &&
    seedProfiles.every((seed) => profiles.some((p) => p?.id === seed.id)) &&
    profiles.every(
      (p) =>
        (p.localChecks === undefined ||
          (object(p.localChecks) &&
            Object.values(p.localChecks).every(
              (group) =>
                object(group) &&
                Object.values(group).every(
                  (check) =>
                    fields(check, ["state", "evidence", "owner", "at"]) &&
                    ["met", "unmet", "unknown"].includes(String(check.state)),
                ),
            ))) &&
        fields(p, [
          "id",
          "name",
          "authorityType",
          "restrictions",
          "note",
          "createdAt",
          "updatedAt",
        ]) &&
        ["city", "town", "village", "mixed", "unknown"].includes(p.setting) &&
        fields(p.context, ["pattern", "population", "geography"]) &&
        fields(p.goals, ["outcome", "ambition", "horizon", "objective"]) &&
        (p.goals.horizon === "unknown" || Number(p.goals.horizon) > 0) &&
        object(p.resources) &&
        p.resources.budget in budgetLabels &&
        p.resources.staff in staffLabels &&
        object(p.assets) &&
        Object.keys(assetLabels).every((key) =>
          ["yes", "no", "unknown"].includes(
            p.assets[key as keyof typeof assetLabels],
          ),
        ) &&
        strings(p.problems) &&
        p.problems.every((d) =>
          ["heat", "water", "services", "unknown"].includes(d),
        ) &&
        strings(p.priorities) &&
        strings(p.existingInitiatives),
    ) &&
    plans.every(
      (p) =>
        validPlan(p) &&
        (p.revisions === undefined ||
          (Array.isArray(p.revisions) &&
            p.revisions.every(
              (r) =>
                fields(r, ["at", "proposal", "goal"]) &&
                (!r.snapshot ||
                  (validPlan(r.snapshot) &&
                    r.snapshot.id === p.id &&
                    r.snapshot.communityId === p.communityId &&
                    !("revisions" in r.snapshot))),
            ))),
    ) &&
    events.every(
      (e) =>
        fields(e, [
          "id",
          "communityId",
          "kind",
          "source",
          "timestamp",
          "validUntil",
        ]) &&
        strings(e.changedFields) &&
        e.kind === "observation" &&
        e.simulation === false,
    ) &&
    outcomes.every((o) =>
      fields(o, [
        "id",
        "planId",
        "date",
        "action",
        "observations",
        "effort",
        "obstacles",
        "lessons",
        "provenance",
      ]),
    ) &&
    drafts.every((d) =>
      fields(d, ["id", "communityId", "exampleId", "text", "updatedAt"]),
    )
  );
}
export function loadState(storage?: Pick<Storage, "getItem">): {
  state: AppState;
  error: string;
} {
  try {
    const raw = (storage ?? localStorage).getItem(STORAGE_KEY);
    if (!raw) return { state: seedState(), error: "" };
    const data = JSON.parse(raw);
    if (!validState(data)) throw Error("Invalid saved data");
    for (const civic of Object.values(data.civic || {})) {
      for (const run of civic.runs)
        if (run.fingerprint.startsWith("{"))
          run.fingerprint = `legacy:${run.id}`;
    }
    return { state: data, error: "" };
  } catch {
    return {
      state: seedState(),
      error:
        "Saved data could not be read. The researched starting profile is shown. Reset this workspace to start a fresh local save.",
    };
  }
}
export function saveState(
  state: AppState,
  storage?: Pick<Storage, "setItem">,
): string {
  try {
    (storage ?? localStorage).setItem(STORAGE_KEY, JSON.stringify(state));
    return "";
  } catch {
    return "This browser could not save your changes. Keep this tab open and download your plan before leaving.";
  }
}
