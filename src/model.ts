import type { CivicWorkspace } from "./civicModel";
export type Setting = "city" | "town" | "village" | "mixed" | "unknown";
export type Knowledge = "yes" | "no" | "unknown";
export type Domain = "heat" | "water" | "services" | "unknown";
export type Budget =
  "none" | "micro" | "small" | "medium" | "capital" | "unknown";
export type Staff = "none" | "limited" | "shared" | "dedicated" | "unknown";
export type Asset =
  | "building"
  | "volunteers"
  | "land"
  | "network"
  | "vehicle"
  | "broadband"
  | "water"
  | "transport"
  | "waterway";
export type Provenance =
  "official source" | "local user entry" | "proposed focus";
export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  published: string;
  checked: string;
  kind:
    | "Municipal source"
    | "Public agency"
    | "Research"
    | "Live data"
    | "Map data";
}
export interface CommunityProfile {
  id: string;
  name: string;
  demo: boolean;
  setting: Setting;
  authorityType: string;
  context: { pattern: string; population: string; geography: string };
  problems: Domain[];
  priorities: string[];
  assets: Record<Asset, Knowledge>;
  existingInitiatives: string[];
  resources: { budget: Budget; staff: Staff };
  restrictions: string;
  goals: {
    outcome: string;
    ambition: string;
    horizon: string;
    objective: string;
  };
  note: string;
  createdAt: string;
  updatedAt: string;
  fieldProvenance: Record<string, Provenance>;
  sources?: string[];
}
export interface ImplementationExample {
  id: string;
  title: string;
  shortTitle: string;
  origin: {
    name: string;
    country: string;
    setting: Setting;
    context: string;
    ambition: string;
    resources: string;
    coordinates: [number, number];
  };
  domain: Domain;
  outcomes: string[];
  mechanism: string;
  preconditions: { asset: Asset; explanation: string }[];
  resourceNeeds: { budget: Budget; staff: Staff };
  timingDays: number | null;
  reportedOutcomes: string[];
  evidenceType: "Documented project";
  sources: string[];
  limitations: string;
  status: string;
  reuse: string[];
  adaptation: string;
  proposal: string;
  fact: { value: string; label: string; asOf: string; sourceId: string };
}
export interface RelevantEvent {
  id: string;
  communityId: string;
  kind: "observation";
  source: string;
  timestamp: string;
  validUntil: string;
  changedFields: string[];
  simulation: false;
}
export interface ReadinessCheck {
  key: string;
  label: string;
  state: "met" | "unmet" | "unknown";
  explanation: string;
}
export interface MatchAssessment {
  example: ImplementationExample;
  reasons: string[];
  similarities: string[];
  differences: string[];
  readiness: ReadinessCheck[];
  evidenceLimitations: string;
  category:
    | "Worth exploring"
    | "Needs confirmation"
    | "Does not fit current constraints";
  factors: { label: string; value: number; explanation: string }[];
  rank: number;
  question: string;
}
export interface PilotPlan {
  id: string;
  communityId: string;
  selectedExamples: string[];
  goal: string;
  retainedInitiatives: string;
  adaptations: string;
  prerequisites: string;
  roleAssignments: string;
  schedule: string;
  metrics: string[];
  reviewStatus: "Draft" | "Ready for local review";
  proposal: string;
  contextSnapshot?: string;
}
export interface OutcomeRecord {
  id: string;
  planId: string;
  date: string;
  action: string;
  observations: string;
  effort: string;
  obstacles: string;
  lessons: string;
  provenance: "User-reported observation — unverified";
}
export interface PeerDraft {
  id: string;
  communityId: string;
  exampleId: string;
  text: string;
  updatedAt: string;
}
export interface AppState {
  version: 2;
  civic?: Record<string, CivicWorkspace>;
  advisor?: {
    name: string;
    role: string;
    activeCommunityId: string;
    entryMode: "guided" | "own";
  };
  profiles: CommunityProfile[];
  events: RelevantEvent[];
  plans: PilotPlan[];
  outcomes: OutcomeRecord[];
  drafts: PeerDraft[];
}
