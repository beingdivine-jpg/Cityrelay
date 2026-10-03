import type { Domain } from "./model";
export type CivicTopic = Domain | "mobility" | "waste";
export type DatasetKey = "reports" | "context" | "resources" | "catalogue";
export type AgentKey = "listener" | "context" | "scout" | "reviewer" | "writer";
export type CivicReport = {
  id: string;
  kind: "complaint" | "idea";
  title: string;
  detail: string;
  area: string;
  topic: CivicTopic;
  submittedAt: string;
  externalConsent: boolean;
  status: "received" | "needs-review";
  duplicateOf?: string;
};
export type Contributor = {
  id: string;
  name: string;
  department: string;
  role: string;
};
export type DataConnection = {
  key: DatasetKey;
  enabled: boolean;
  ownerId: string;
};
export type AgentCitation = {
  url: string;
  title: string;
  start?: number;
  end?: number;
};
export type AgentStep = {
  id: AgentKey;
  title: string;
  status: "running" | "complete" | "failed";
  startedAt: string;
  completedAt?: string;
  input: string;
  output: string;
  citations: AgentCitation[];
};
export type TopicSignal = {
  topic: CivicTopic;
  count: number;
  ideas: number;
  reportIds: string[];
  summary: string;
};
export type FitFactor = {
  checkKey?: string;
  name: string;
  state: "aligned" | "unknown" | "different" | "blocked";
  detail: string;
  sources?: string[];
};
export type CivicOpportunity = {
  exampleId: string;
  topic: CivicTopic;
  reportCount: number;
  state: "ready" | "investigate" | "hold";
  factors: FitFactor[];
  reason: string;
};
export type IdeaTriage = {
  reportId: string;
  state: "review" | "hold";
  reason: string;
  exampleIds: string[];
};
export type AgentRun = {
  id: string;
  startedAt: string;
  completedAt: string;
  mode: "local" | "ai";
  status: "complete" | "failed";
  fingerprint: string;
  steps: AgentStep[];
  signals: TopicSignal[];
  opportunities: CivicOpportunity[];
  ideas: IdeaTriage[];
  reportCount: number;
  error?: string;
};
export type CivicNotice = {
  id: string;
  title: string;
  detail: string;
  at: string;
  read: boolean;
  kind: "analysis" | "source" | "report";
  href?: string;
};
export type SourceSnapshot = {
  excerpt?: string;
  url: string;
  title: string;
  checkedAt: string;
  hash: string | null;
  status: "ok" | "unavailable";
  error?: string;
};
export type CivicWorkspace = {
  authority: {
    kind:
      "Municipality" | "City council" | "Regional authority" | "Public agency";
    name: string;
    confirmed: boolean;
  };
  documents: {
    id: string;
    title: string;
    ownerId: string;
    text: string;
    enabled: boolean;
    externalConsent: boolean;
    createdAt: string;
  }[];
  contributors: Contributor[];
  connections: DataConnection[];
  reports: CivicReport[];
  runs: AgentRun[];
  decisionHistory?: {
    key: string;
    state: "shortlist" | "hold";
    note: string;
    at: string;
    actor: string;
    runId?: string;
  }[];
  decisions: Record<
    string,
    { state: "shortlist" | "hold"; note: string; at: string; runId?: string }
  >;
  notices: CivicNotice[];
  monitor: {
    enabled: boolean;
    lastChecked?: string;
    lastError?: string;
    snapshots: SourceSnapshot[];
  };
};
