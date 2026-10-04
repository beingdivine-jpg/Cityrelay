export const jurySteps = [
  "listen",
  "team",
  "access",
  "launch",
  "run",
  "compare",
  "choose",
  "evidence",
  "reality",
  "shape",
  "export",
  "done",
] as const;
export type JuryStep = (typeof jurySteps)[number];
export type JuryAction =
  | "voice"
  | "data"
  | "agents"
  | "started"
  | "completed"
  | "stopped"
  | "findings"
  | "case"
  | "fit"
  | "adapt"
  | "pilot"
  | "downloaded";
const gates: Partial<Record<JuryStep, [JuryAction, JuryStep]>> = {
  listen: ["voice", "team"],
  team: ["data", "access"],
  access: ["agents", "launch"],
  launch: ["started", "run"],
  run: ["completed", "compare"],
  compare: ["findings", "choose"],
  choose: ["case", "evidence"],
  evidence: ["fit", "reality"],
  reality: ["adapt", "shape"],
  shape: ["pilot", "export"],
  export: ["downloaded", "done"],
};
export function advanceJuryStep(step: JuryStep, action: JuryAction): JuryStep {
  if (step === "run" && action === "stopped") return "launch";
  return gates[step]?.[0] === action ? gates[step]![1] : step;
}
export const juryRoot = "/community/krakow-demo";
export function juryRoute(step: JuryStep, caseId: string): string {
  if (["listen", "team"].includes(step)) return juryRoot;
  if (step === "access") return `${juryRoot}/data`;
  if (["launch", "run", "compare"].includes(step)) return `${juryRoot}/agents`;
  if (step === "choose") return `${juryRoot}/opportunities`;
  if (["evidence", "reality", "shape"].includes(step))
    return `${juryRoot}/matches/${caseId}`;
  return `${juryRoot}/plan`;
}
export type JuryEvent =
  { action: JuryAction } | { agent: string; waiting: boolean };
export function reportJuryEvent(event: JuryEvent) {
  window.dispatchEvent(new CustomEvent("elsewhere:jury", { detail: event }));
}
