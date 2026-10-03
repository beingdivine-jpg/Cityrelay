import { afterEach, describe, expect, it, vi } from "vitest";
import { examples, seedProfiles } from "./data";
import {
  allowed,
  buildOpportunities,
  compareFactors,
  duplicateReport,
  localAnalysis,
  needsReview,
  newCivic,
  runFingerprint,
  summarizeReports,
  triageIdeas,
} from "./civicEngine";
import { validCivic } from "./civicStorage";
import { applySnapshots } from "./CivicContext";
import type { CivicReport, SourceSnapshot } from "./civicModel";
const profile = () => structuredClone(seedProfiles[0]);
const report = (
  id: string,
  overrides: Partial<CivicReport> = {},
): CivicReport => ({
  id,
  kind: "complaint",
  title: `Concern ${id}`,
  detail: "A detailed local concern for analysis.",
  area: "",
  topic: "services",
  submittedAt: new Date().toISOString(),
  externalConsent: false,
  status: "received",
  ...overrides,
});
afterEach(() => vi.unstubAllGlobals());
describe("Resident evidence and input permissions", () => {
  it("starts without invented submissions, runs or verified authority", () => {
    const c = newCivic(profile());
    expect(c.reports).toEqual([]);
    expect(c.runs).toEqual([]);
    expect(c.authority.confirmed).toBe(false);
    expect(validCivic({ krakow: c })).toBe(true);
  });
  it("counts eligible unique complaints separately from ideas and holds", () => {
    const signals = summarizeReports([
      report("1"),
      report("2"),
      report("3", { topic: "heat" }),
      report("4", { kind: "idea", topic: "heat" }),
      report("5", { duplicateOf: "1" }),
      report("6", { status: "needs-review" }),
    ]);
    expect(signals.map((s) => [s.topic, s.count, s.ideas])).toEqual([
      ["services", 2, 0],
      ["heat", 1, 1],
    ]);
  });
  it("recognizes exact normalized duplicates without merging distinct concerns", () => {
    const r = report("1");
    expect(
      duplicateReport(
        [r],
        "CONCERN 1",
        " A detailed local concern for analysis. ",
      ),
    ).toBe("1");
    expect(
      duplicateReport([r], r.title, "A different experience worth preserving."),
    ).toBeUndefined();
  });
  it("holds contact information for intake review", () => {
    expect(needsReview("Please write to someone@example.com about this.")).toBe(
      true,
    );
    expect(needsReview("Please call +48 123 456 789 about this.")).toBe(true);
    expect(needsReview("People need shade at the tram stop.")).toBe(false);
  });
  it("withholding municipal context removes population and initiative claims", () => {
    const p = profile(),
      c = newCivic(p);
    const ex = examples.find((e) => e.id === "helsinki-info")!;
    expect(
      compareFactors(p, c, ex).find((f) => f.name === "Population scale")
        ?.detail,
    ).toContain("15% smaller");
    c.connections.find((x) => x.key === "context")!.enabled = false;
    expect(
      compareFactors(p, c, ex).find((f) => f.name === "Population scale")
        ?.state,
    ).toBe("unknown");
  });
  it("withholding resources never treats recorded assets as shared", () => {
    const p = profile(),
      c = newCivic(p);
    p.assets.building = "yes";
    c.connections.find((x) => x.key === "resources")!.enabled = false;
    expect(
      compareFactors(p, c, examples[0]).some((f) =>
        f.detail.includes("Recorded as available"),
      ),
    ).toBe(false);
  });
  it("withholding repository prevents retrieval, and unsupported ideas stay held", () => {
    const p = profile(),
      c = newCivic(p);
    c.connections.find((x) => x.key === "catalogue")!.enabled = false;
    expect(allowed(c, "catalogue")).toBe(false);
    expect(buildOpportunities(p, c, [])).toEqual([]);
    expect(
      triageIdeas([report("1", { kind: "idea", topic: "waste" })], [])[0].state,
    ).toBe("hold");
  });
  it("orders evidence by complaint volume and never approves unknown feasibility", () => {
    const p = profile(),
      c = newCivic(p);
    const signals = summarizeReports([
      report("1"),
      report("2"),
      report("3", { topic: "heat" }),
    ]);
    const leads = buildOpportunities(p, c, signals);
    expect(leads[0].exampleId).toBe("helsinki-info");
    expect(leads.every((l) => l.state === "investigate")).toBe(true);
    expect(triageIdeas([report("4", { kind: "idea" })], leads)[0].state).toBe(
      "hold",
    );
  });
  it("processes five actual stages and excludes withheld reports from results", async () => {
    vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
      cb();
      return 0;
    });
    const p = profile(),
      c = newCivic(p);
    c.reports = [report("1")];
    c.connections.find((x) => x.key === "reports")!.enabled = false;
    const transitions: string[] = [];
    const result = await localAnalysis(p, c, (s) =>
      transitions.push(`${s.id}:${s.status}`),
    );
    expect(result.reportCount).toBe(0);
    expect(result.signals).toEqual([]);
    expect(result.steps).toHaveLength(5);
    expect(transitions).toHaveLength(10);
    expect(result.steps[2].output).toContain("did not search the live web");
    expect(result.opportunities.every((o) => o.topic === "heat")).toBe(true);
    c.runs = [result];
    expect(validCivic({ krakow: c })).toBe(true);
  });
  it("invalidates research on evidence changes, not on reading a notice", () => {
    const p = profile(),
      c = newCivic(p);
    const fingerprint = runFingerprint(p, c);
    c.notices.push({
      id: "1",
      title: "Update",
      detail: "test",
      at: "now",
      read: true,
      kind: "analysis",
    });
    expect(runFingerprint(p, c)).toBe(fingerprint);
    c.reports.push(report("1"));
    expect(runFingerprint(p, c)).not.toBe(fingerprint);
  });
  it("rejects corrupt civic data instead of crashing during rendering", () => {
    const c = newCivic(profile());
    expect(
      validCivic({
        krakow: { ...c, reports: [{ ...report("1"), topic: "made-up" }] },
      }),
    ).toBe(false);
  });
});
describe("Evidence monitoring", () => {
  const snapshot = (
    hash: string | null,
    status: "ok" | "unavailable" = "ok",
  ): SourceSnapshot => ({
    url: "https://www.hel.fi/example",
    title: "Municipal source",
    checkedAt: new Date().toISOString(),
    hash,
    status,
  });
  it("does not invent an update on the baseline or on unchanged content", () => {
    const baseline = applySnapshots(newCivic(profile()), [snapshot("a")]);
    expect(baseline.notices).toEqual([]);
    expect(applySnapshots(baseline, [snapshot("a")]).notices).toEqual([]);
  });
  it("alerts only on a changed successful source, preserving comparison through outages", () => {
    const baseline = applySnapshots(newCivic(profile()), [snapshot("a")]);
    const failed = applySnapshots(baseline, [snapshot(null, "unavailable")]);
    expect(failed.monitor.snapshots[0].hash).toBe("a");
    expect(failed.notices).toEqual([]);
    const changed = applySnapshots(failed, [snapshot("b")]);
    expect(changed.notices).toHaveLength(1);
    expect(changed.notices[0].detail).toContain("Review the source");
  });
});
