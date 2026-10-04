import type { CivicWorkspace } from "./civicModel";
import { examples } from "./data";
import { validFitScore } from "./fitScore";
const validScorecard = (value: unknown) =>
  validFitScore(value) &&
  examples.some((example) => example.id === value.exampleId);
const agents = ["listener", "context", "scout", "reviewer", "writer"];
const topics = ["heat", "water", "services", "mobility", "waste", "unknown"];
const count = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown) => typeof v === "string";
const httpsUrl = (v: unknown) => {
  if (typeof v !== "string") return false;
  try {
    const url = new URL(v);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
};
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
          ["local", "ai"].includes(String(x.mode)) &&
          ["complete", "failed", "incomplete"].includes(String(x.status)) &&
          count(x.reportCount) &&
          (x.events === undefined ||
            list(
              x.events,
              (e) =>
                obj(e) &&
                (e.scorecard === undefined || validScorecard(e.scorecard)) &&
                fields(e, ["id", "at", "agent", "kind", "title", "detail"]) &&
                ["listener", "context", "scout", "reviewer", "writer"].includes(
                  String(e.agent),
                ) &&
                [
                  "input",
                  "query",
                  "source",
                  "check",
                  "output",
                  "handoff",
                  "error",
                ].includes(String(e.kind)) &&
                (e.url === undefined || httpsUrl(e.url)),
            )) &&
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
              agents.includes(String(s.id)) &&
              ["running", "complete", "failed"].includes(String(s.status)) &&
              list(
                s.citations,
                (z) => fields(z, ["url", "title"]) && obj(z) && httpsUrl(z.url),
              ),
          ) &&
          list(
            x.signals,
            (s) =>
              obj(s) &&
              fields(s, ["topic", "summary"]) &&
              topics.includes(String(s.topic)) &&
              count(s.count) &&
              count(s.ideas) &&
              list(s.reportIds, text),
          ) &&
          list(
            x.opportunities,
            (o) =>
              obj(o) &&
              (o.scorecard === undefined ||
                (validScorecard(o.scorecard) &&
                  (o.scorecard as { exampleId: string }).exampleId ===
                    o.exampleId)) &&
              fields(o, ["exampleId", "topic", "state", "reason"]) &&
              examples.some((example) => example.id === o.exampleId) &&
              topics.includes(String(o.topic)) &&
              ["ready", "investigate", "hold"].includes(String(o.state)) &&
              count(o.reportCount) &&
              list(o.factors, (f) => fields(f, ["name", "state", "detail"])),
          ) &&
          list(
            x.ideas,
            (i) =>
              obj(i) &&
              fields(i, ["reportId", "state", "reason"]) &&
              ["review", "hold"].includes(String(i.state)) &&
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
          typeof x.read === "boolean" &&
          (x.href === undefined || httpsUrl(x.href)),
      ) &&
      obj(c.monitor) &&
      typeof c.monitor.enabled === "boolean" &&
      list(
        c.monitor.snapshots,
        (x) =>
          obj(x) &&
          fields(x, ["url", "title", "checkedAt", "status"]) &&
          httpsUrl(x.url) &&
          ["ok", "unavailable"].includes(String(x.status)) &&
          (x.hash === null || text(x.hash)),
      ),
  );
}
