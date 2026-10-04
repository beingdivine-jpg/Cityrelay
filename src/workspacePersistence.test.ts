import { expect, it } from "vitest";
import { seedState, validState } from "./storage";
import { WorkspacePersistence, saveConflict } from "./workspacePersistence";
import { startDemo, DEMO_ID } from "./demo";
import { localAnalysis, runFingerprint } from "./civicEngine";
import { researchCheckpoint, saveResearchRecord } from "./researchRecord";
import type { AgentEvent, AgentStep } from "./civicModel";

function store(initial = seedState()) {
  let raw = JSON.stringify(initial);
  let writes = 0;
  return {
    getItem: () => raw,
    setItem: (_: string, next: string) => {
      raw = next;
      writes++;
    },
    writes: () => writes,
  };
}

it("preserves every stage of a real investigation with delayed receiving-tab effects", async () => {
  const initial = startDemo(seedState());
  const disk = store(initial);
  const writer = new WorkspacePersistence(initial, disk);
  const reader = new WorkspacePersistence(initial, disk);
  const profile = initial.profiles.find((p) => p.id === DEMO_ID)!;
  const civic = initial.civic![DEMO_ID];
  const base = {
    id: "sync-run",
    mode: "local" as const,
    startedAt: new Date().toISOString(),
    fingerprint: runFingerprint(profile, civic),
  };
  let current = initial;
  let previousIncoming = initial;
  let steps: AgentStep[] = [];
  const events: AgentEvent[] = [];
  let checkpoints = 0;
  const checkpoint = () => {
    current = {
      ...current,
      civic: {
        ...current.civic,
        [DEMO_ID]: {
          ...civic,
          runs: saveResearchRecord(
            civic.runs,
            researchCheckpoint(base, steps, events),
          ),
        },
      },
    };
    expect(validState(current)).toBe(true);
    writer.observe(current);
    expect(writer.save(current)).toBe("");
    const incoming = reader.receive(disk.getItem());
    expect(incoming.error).toBeUndefined();
    expect(incoming.state).toBeDefined();
    if (checkpoints) {
      // React may finish an older incoming render after this event arrived.
      reader.observe(previousIncoming);
      const before = disk.writes();
      expect(reader.save(previousIncoming)).toBe("");
      expect(disk.writes()).toBe(before);
    }
    previousIncoming = incoming.state!;
    checkpoints++;
  };
  const run = await localAnalysis(
    profile,
    civic,
    (step) => {
      steps = [...steps.filter((s) => s.id !== step.id), structuredClone(step)];
      checkpoint();
    },
    {
      onEvent: (event) => {
        events.push(event);
        checkpoint();
      },
    },
  );
  expect(checkpoints).toBeGreaterThan(40);
  current.civic![DEMO_ID].runs = [{ ...run, id: base.id }];
  writer.observe(current);
  expect(writer.save(current)).toBe("");
  const final = reader.receive(disk.getItem());
  expect(final.state?.civic?.[DEMO_ID].runs[0].status).toBe("complete");
  expect(JSON.parse(disk.getItem()).civic[DEMO_ID].runs[0].events.length).toBe(
    run.events!.length,
  );
});

it("ignores stale events, protects unsaved edits and persists an explicit restored backup", () => {
  const initial = seedState(),
    disk = store(initial);
  const tab = new WorkspacePersistence(initial, disk);
  const oldRaw = disk.getItem();
  const remote = structuredClone(initial);
  remote.profiles[0].note = "Other tab's saved edit";
  disk.setItem("", JSON.stringify(remote));
  expect(tab.receive(oldRaw)).toEqual({});
  const local = structuredClone(initial);
  local.profiles[0].note = "Unsaved local edit";
  tab.observe(local);
  expect(tab.receive(disk.getItem()).error).toBe(saveConflict);
  expect(tab.save(local)).toBe(saveConflict);
  expect(JSON.parse(disk.getItem()).profiles[0].note).toBe(
    remote.profiles[0].note,
  );
  tab.restore(local);
  expect(tab.save(local)).toBe("");
  expect(JSON.parse(disk.getItem()).profiles[0].note).toBe(
    local.profiles[0].note,
  );
});

it("retains the last saved version when storage rejects an edit", () => {
  const initial = seedState();
  const disk = {
    getItem: () => JSON.stringify(initial),
    setItem: () => {
      throw Error("Quota exceeded");
    },
  };
  const tab = new WorkspacePersistence(initial, disk);
  const local = structuredClone(initial);
  local.profiles[0].note = "Recover me";
  tab.observe(local);
  expect(tab.save(local)).toContain("could not save");
  expect(JSON.parse(disk.getItem()).profiles[0].note).toBe(
    initial.profiles[0].note,
  );
});
