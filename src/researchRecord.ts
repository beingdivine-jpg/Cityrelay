import type { AgentEvent, AgentRun, AgentStep } from "./civicModel";

export const partialRunMessage =
  "This investigation did not finish. Its recorded actions are saved. Start a new investigation to continue.";

/** A checkpoint contains observed work, never provisional recommendations. */
export function researchCheckpoint(
  base: Pick<AgentRun, "id" | "startedAt" | "mode" | "fingerprint">,
  steps: AgentStep[],
  events: AgentEvent[],
): AgentRun {
  return {
    ...base,
    status: "incomplete",
    completedAt: "",
    steps: structuredClone(steps),
    events: structuredClone(events),
    signals: [],
    opportunities: [],
    ideas: [],
    reportCount: 0,
  };
}

export function saveResearchRecord(runs: AgentRun[], record: AgentRun) {
  return [record, ...runs.filter((r) => r.id !== record.id)].slice(0, 20);
}

/** A saved partial record is not a process running in this page. */
export function recordedRun(run: AgentRun | undefined): AgentRun | undefined {
  if (run?.status !== "incomplete") return run;
  return {
    ...run,
    error: partialRunMessage,
    steps: run.steps.map((step) =>
      step.status === "running"
        ? {
            ...step,
            status: "failed",
            output: step.output || partialRunMessage,
          }
        : step,
    ),
  };
}
