import { expect, it } from "vitest";
import { startDemo, DEMO_ID } from "./demo";
import { localAnalysis, runFingerprint } from "./civicEngine";
import { loadState, seedState, validState } from "./storage";
import {
  recordedRun,
  researchCheckpoint,
  saveResearchRecord,
} from "./researchRecord";
import type { AgentEvent, AgentStep } from "./civicModel";

it("keeps actual partial work after serialization without presenting unfinished research as findings", async () => {
  const state = startDemo(seedState());
  const profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  const civic = state.civic![DEMO_ID];
  const controller = new AbortController();
  const events: AgentEvent[] = [];
  let steps: AgentStep[] = [];
  const base = {
    id: "recoverable-run",
    startedAt: new Date().toISOString(),
    mode: "local" as const,
    fingerprint: runFingerprint(profile, civic),
  };
  const checkpoint = () => {
    civic.runs = saveResearchRecord(
      civic.runs,
      researchCheckpoint(base, steps, events),
    );
  };
  await expect(
    localAnalysis(
      profile,
      civic,
      (step) => {
        steps = [
          ...steps.filter((s) => s.id !== step.id),
          structuredClone(step),
        ];
        checkpoint();
      },
      {
        signal: controller.signal,
        onEvent: (event) => {
          events.push(event);
          checkpoint();
        },
        beforeStep: async (agent) => {
          if (agent === "context") controller.abort();
        },
      },
    ),
  ).rejects.toThrow();
  const restored = loadState({ getItem: () => JSON.stringify(state) });
  expect(restored.error).toBe("");
  const run = restored.state.civic![DEMO_ID].runs[0];
  expect(run.id).toBe(base.id);
  expect(run.status).toBe("incomplete");
  expect(run.events!.length).toBeGreaterThan(15);
  expect(
    run.steps.some((s) => s.id === "listener" && s.status === "complete"),
  ).toBe(true);
  expect(run.opportunities).toEqual([]);
  expect(run.signals).toEqual([]);
  expect(recordedRun(run)?.error).toContain("did not finish");
  expect(validState(restored.state)).toBe(true);
});

it("snapshots do not mutate with the active engine and finishing replaces only the matching record", () => {
  const step: AgentStep = {
    id: "listener",
    title: "Listener",
    status: "running",
    startedAt: "2026-10-04T00:00:00Z",
    input: "Input",
    output: "",
    citations: [],
  };
  const base = {
    id: "current",
    startedAt: step.startedAt,
    mode: "local" as const,
    fingerprint: "test",
  };
  const partial = researchCheckpoint(base, [step], []);
  step.status = "complete";
  expect(partial.steps[0].status).toBe("running");
  expect(recordedRun(partial)?.steps[0].status).toBe("failed");
  expect(partial.steps[0].status).toBe("running");
  const prior = { ...partial, id: "prior", status: "complete" as const };
  const finished = { ...partial, status: "complete" as const };
  expect(saveResearchRecord([partial, prior], finished)).toEqual([
    finished,
    prior,
  ]);
});
