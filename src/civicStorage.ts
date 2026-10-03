import type { CivicWorkspace } from "./civicModel";
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) => typeof v === "string";
const fields = (v: unknown, keys: string[]) =>
  obj(v) && keys.every((k) => text(v[k]));
const list = (v: unknown, check: (x: unknown) => boolean): boolean =>
  Array.isArray(v) && v.every(check);
export function validCivic(
  value: unknown,
): value is Record<string, CivicWorkspace> {
  if (!obj(value)) return false;
  return Object.values(value).every(
    (c) =>
      obj(c) &&
      fields(c.authority, ["kind", "name"]) &&
      obj(c.authority) &&
      typeof c.authority.confirmed === "boolean" &&
      list(c.contributors, (x) =>
        fields(x, ["id", "name", "department", "role"]),
      ) &&
      list(
        c.connections,
        (x) =>
          obj(x) &&
          fields(x, ["key", "ownerId"]) &&
          ["reports", "context", "resources", "catalogue"].includes(
            String(x.key),
          ) &&
          typeof x.enabled === "boolean",
      ) &&
      list(
        c.documents,
        (x) =>
          obj(x) &&
          fields(x, ["id", "title", "ownerId", "text", "createdAt"]) &&
          typeof x.enabled === "boolean" &&
          typeof x.externalConsent === "boolean",
      ) &&
      list(
        c.reports,
        (x) =>
          obj(x) &&
          fields(x, [
            "id",
            "kind",
            "title",
            "detail",
            "area",
            "topic",
            "submittedAt",
            "status",
          ]) &&
          ["received", "needs-review"].includes(String(x.status)) &&
          ["complaint", "idea"].includes(String(x.kind)) &&
          [
            "heat",
            "water",
            "services",
            "mobility",
            "waste",
            "unknown",
          ].includes(String(x.topic)) &&
          typeof x.externalConsent === "boolean" &&
          (x.duplicateOf === undefined || text(x.duplicateOf)),
      ) &&
      list(
        c.runs,
        (x) =>
          obj(x) &&
          fields(x, [
            "id",
            "mode",
            "status",
            "startedAt",
            "completedAt",
            "fingerprint",
          ]) &&
          typeof x.reportCount === "number" &&
          list(
            x.steps,
            (s) =>
              obj(s) &&
              fields(s, [
                "id",
                "title",
                "status",
                "startedAt",
                "input",
                "output",
              ]) &&
              list(s.citations, (z) => fields(z, ["url", "title"])),
          ) &&
          list(
            x.signals,
            (s) =>
              obj(s) &&
              fields(s, ["topic", "summary"]) &&
              typeof s.count === "number" &&
              typeof s.ideas === "number" &&
              list(s.reportIds, text),
          ) &&
          list(
            x.opportunities,
            (o) =>
              obj(o) &&
              fields(o, ["exampleId", "topic", "state", "reason"]) &&
              typeof o.reportCount === "number" &&
              list(o.factors, (f) => fields(f, ["name", "state", "detail"])),
          ) &&
          list(
            x.ideas,
            (i) =>
              obj(i) &&
              fields(i, ["reportId", "state", "reason"]) &&
              list(i.exampleIds, text),
          ),
      ) &&
      obj(c.decisions) &&
      Object.values(c.decisions).every((x) =>
        fields(x, ["state", "note", "at"]),
      ) &&
      list(
        c.notices,
        (x) =>
          obj(x) &&
          fields(x, ["id", "title", "detail", "at", "kind"]) &&
          typeof x.read === "boolean",
      ) &&
      obj(c.monitor) &&
      typeof c.monitor.enabled === "boolean" &&
      list(
        c.monitor.snapshots,
        (x) =>
          obj(x) &&
          fields(x, ["url", "title", "checkedAt", "status"]) &&
          (x.hash === null || text(x.hash)),
      ),
  );
}
