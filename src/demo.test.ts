import { expect, it, vi, afterEach } from "vitest";
import { DEMO_ID, startDemo } from "./demo";
import { seedState, validState } from "./storage";
import { localAnalysis, summarizeReports } from "./civicEngine";
import { workspaceDocument } from "./shared";
import { exportPlan, createPlan } from "./planLogic";
import { examples } from "./data";
import type { AgentEvent, AgentKey } from "./civicModel";
import { translateText } from "./i18n";
afterEach(() => vi.unstubAllGlobals());
it("opens an isolated, idempotent demo without overwriting existing Krakow work", () => {
  const before = seedState();
  before.profiles[0].note = "My existing advisor note";
  const state = startDemo(before),
    demo = state.civic![DEMO_ID];
  expect(state.profiles[0].note).toBe(before.profiles[0].note);
  expect(demo.reports).toHaveLength(18);
  expect(
    demo.reports.every((r) => r.provenance === "demo" && !r.externalConsent),
  ).toBe(true);
  expect(demo.authority.confirmed).toBe(false);
  expect(summarizeReports(demo.reports).map((s) => [s.topic, s.count])).toEqual(
    [
      ["heat", 6],
      ["services", 4],
      ["water", 2],
      ["waste", 1],
    ],
  );
  demo.reports[0].title = "Edited demo concern";
  expect(startDemo(state).civic![DEMO_ID].reports[0].title).toBe(
    "Edited demo concern",
  );
  expect(validState(state)).toBe(true);
  expect(() => workspaceDocument(state, DEMO_ID)).toThrow("sample demo");
  expect(
    exportPlan(
      state.profiles[1],
      createPlan(state.profiles[1], examples[0]),
      state,
    ),
  ).toContain("DEMO:");
});
it("records actual grouping, retrieval, source checks and handoffs in order", async () => {
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState()),
    events: AgentEvent[] = [],
    gates: AgentKey[] = [];
  const run = await localAnalysis(
    state.profiles[1],
    state.civic![DEMO_ID],
    () => {},
    {
      onEvent: (e) => events.push(e),
      beforeStep: async (key) => {
        gates.push(key);
      },
      checkSources: async (emit) => {
        emit({
          kind: "source",
          title: "Source page retrieved",
          detail: "Test source response",
          url: "https://www.hel.fi/example",
        });
      },
    },
  );
  expect(gates).toEqual(["listener", "context", "scout", "reviewer", "writer"]);
  expect(run.reportCount).toBe(16);
  expect(
    events.filter((e) => e.title === "Duplicate excluded from counts"),
  ).toHaveLength(1);
  expect(events.some((e) => e.kind === "query" && e.agent === "scout")).toBe(
    true,
  );
  expect(
    events.some(
      (e) =>
        e.title === "Evidence gap kept visible" &&
        e.detail === "Waste & cleanliness",
    ),
  ).toBe(true);
  expect(events.at(-1)?.title).toBe("Ready for advisor review");
  expect(run.events).toEqual(events);
  state.civic![DEMO_ID].runs = [run];
  expect(validState(state)).toBe(true);
});
it("does not progress past a cancelled handoff", async () => {
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState()),
    civic = state.civic![DEMO_ID],
    finished: AgentKey[] = [];
  civic.connections.find((c) => c.key === "catalogue")!.enabled = false;
  const checkSources = vi.fn(),
    controller = new AbortController();
  await expect(
    localAnalysis(
      state.profiles[1],
      civic,
      (s) => {
        if (s.status === "complete") finished.push(s.id);
      },
      {
        signal: controller.signal,
        beforeStep: async (key) => {
          if (key === "context") controller.abort();
        },
        checkSources,
      },
    ),
  ).rejects.toThrow();
  expect(finished).toEqual(["listener"]);
  expect(checkSources).not.toHaveBeenCalled();
});
it("never checks source pages when catalogue access is withheld", async () => {
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState()),
    civic = state.civic![DEMO_ID];
  civic.connections.find((c) => c.key === "catalogue")!.enabled = false;
  const checkSources = vi.fn();
  const run = await localAnalysis(state.profiles[1], civic, () => {}, {
    checkSources,
  });
  expect(checkSources).not.toHaveBeenCalled();
  expect(run.opportunities).toHaveLength(0);
  expect(
    run.events?.some((e) => e.title === "Documented candidate retrieved"),
  ).toBe(false);
});
it("translates all seeded report titles and details into Polish", () => {
  const state = startDemo(seedState());
  for (const report of state.civic![DEMO_ID].reports) {
    expect(translateText(report.title, "pl")).not.toBe(report.title);
    expect(translateText(report.detail, "pl")).not.toBe(report.detail);
  }
});
