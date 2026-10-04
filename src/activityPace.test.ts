import { afterEach, expect, it, vi } from "vitest";
import { waitForActivity } from "./activityPace";
import { localAnalysis } from "./civicEngine";
import { DEMO_ID, startDemo } from "./demo";
import { seedState } from "./storage";
import type { AgentEvent, AgentKey } from "./civicModel";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("exposes one action at a time and cannot hand off while it is being read", async () => {
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState());
  const events: AgentEvent[] = [],
    completed: AgentKey[] = [];
  let release!: () => void;
  let firstRecorded!: () => void;
  const recorded = new Promise<void>((resolve) => {
    firstRecorded = resolve;
  });
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const run = localAnalysis(
    state.profiles[1],
    state.civic![DEMO_ID],
    (step) => {
      if (step.status === "complete") completed.push(step.id);
    },
    {
      onEvent: (event) => events.push(event),
      afterEvent: async () => {
        if (events.length === 1) {
          firstRecorded();
          await held;
        }
      },
    },
  );
  await recorded;
  expect(events).toHaveLength(1);
  expect(completed).toEqual([]);
  await Promise.resolve();
  expect(events).toHaveLength(1);
  release();
  const result = await run;
  expect(completed).toEqual([
    "listener",
    "context",
    "scout",
    "reviewer",
    "writer",
  ]);
  expect(result.events).toEqual(events);
  expect(result.reportCount).toBe(16);
});
it("stops during an individual action without manufacturing a completed stage", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState()),
    controller = new AbortController();
  const events: AgentEvent[] = [],
    completed: AgentKey[] = [];
  const run = localAnalysis(
    state.profiles[1],
    state.civic![DEMO_ID],
    (step) => {
      if (step.status === "complete") completed.push(step.id);
    },
    {
      signal: controller.signal,
      onEvent: (event) => events.push(event),
      afterEvent: () => waitForActivity(controller.signal, 700),
    },
  );
  const rejection = expect(run).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(100);
  expect(events).toHaveLength(1);
  controller.abort();
  await rejection;
  await vi.runAllTimersAsync();
  expect(events).toHaveLength(1);
  expect(completed).toEqual([]);
  expect(vi.getTimerCount()).toBe(0);
});
it("records real source callbacks immediately without adding reading intervals", async () => {
  vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
    cb();
    return 0;
  });
  const state = startDemo(seedState()),
    paced: AgentEvent[] = [];
  const result = await localAnalysis(
    state.profiles[1],
    state.civic![DEMO_ID],
    () => {},
    {
      afterEvent: async (event) => {
        paced.push(event);
      },
      checkSources: async (emit) => {
        emit({
          kind: "source",
          title: "Checking a live source page",
          detail: "Test request",
        });
        emit({
          kind: "source",
          title: "Source page retrieved",
          detail: "Test response",
        });
      },
    },
  );
  expect(
    result.events?.filter((e) => e.detail.startsWith("Test ")),
  ).toHaveLength(2);
  expect(paced.some((e) => e.detail.startsWith("Test "))).toBe(false);
  expect(
    result.events?.filter((e) => e.title === "Handoff ready"),
  ).toHaveLength(4);
});
