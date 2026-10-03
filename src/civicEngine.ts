import type { CommunityProfile, ImplementationExample } from "./model";
import type {
  AgentKey,
  AgentRun,
  AgentStep,
  CivicOpportunity,
  CivicReport,
  CivicTopic,
  CivicWorkspace,
  DatasetKey,
  IdeaTriage,
  TopicSignal,
} from "./civicModel";
import { examples, assetLabels } from "./data";
import { getSource } from "./sources";
export const topicLabels: Record<CivicTopic, string> = {
  heat: "Heat & shade",
  water: "Rain & water",
  services: "Public services",
  mobility: "Getting around",
  waste: "Waste & cleanliness",
  unknown: "Other / needs clarification",
};
export const datasetLabels: Record<DatasetKey, string> = {
  reports: "Resident reports & ideas",
  context: "Municipal context & initiatives",
  resources: "Resources & site conditions",
  catalogue: "Documented project library",
};
export const agentDefinitions: {
  id: AgentKey;
  name: string;
  verb: string;
  description: string;
}[] = [
  {
    id: "listener",
    name: "Listener",
    verb: "Hear the city",
    description:
      "Groups reports, removes exact duplicates and ranks the reported needs.",
  },
  {
    id: "context",
    name: "City analyst",
    verb: "Know the place",
    description:
      "Reads the council profile, shared assets and local constraints.",
  },
  {
    id: "scout",
    name: "Research scout",
    verb: "Look elsewhere",
    description: "Finds source-backed approaches and keeps an evidence trail.",
  },
  {
    id: "reviewer",
    name: "Fit reviewer",
    verb: "Explain the fit",
    description:
      "Checks similarities, differences and the conditions still to resolve.",
  },
  {
    id: "writer",
    name: "Brief writer",
    verb: "Make it reviewable",
    description:
      "Builds a research memo for a human decision, never an automatic approval.",
  },
];
export function newCivic(profile: CommunityProfile): CivicWorkspace {
  return {
    authority: {
      kind: "Municipality",
      name:
        profile.id === "krakow"
          ? "Gmina Miejska Kraków"
          : profile.authorityType === "Unknown"
            ? ""
            : profile.authorityType,
      confirmed: false,
    },
    documents: [],
    contributors: [
      {
        id: "lead",
        name: "You",
        department: "Innovation team",
        role: "Lead advisor",
      },
    ],
    connections: (Object.keys(datasetLabels) as DatasetKey[]).map((key) => ({
      key,
      enabled: true,
      ownerId: "lead",
    })),
    reports: [],
    runs: [],
    decisions: {},
    notices: [],
    monitor: { enabled: false, snapshots: [] },
  };
}
export function allowed(civic: CivicWorkspace, key: DatasetKey) {
  return civic.connections.some((c) => c.key === key && c.enabled);
}
const normalize = (s: string) =>
  s.toLowerCase().normalize("NFKC").replace(/\s+/g, " ").trim();
export function duplicateReport(
  reports: CivicReport[],
  title: string,
  detail: string,
) {
  return reports.find(
    (r) =>
      normalize(r.title + " " + r.detail) === normalize(title + " " + detail),
  )?.id;
}
export function needsReview(text: string) {
  return (
    /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?\d[\d ()-]{7,}\d)/i.test(text) ||
    text.trim().length < 20
  );
}
export function summarizeReports(reports: CivicReport[]): TopicSignal[] {
  const usable = reports.filter(
    (r) => r.status === "received" && !r.duplicateOf,
  );
  return (Object.keys(topicLabels) as CivicTopic[])
    .map((topic) => {
      const related = usable.filter((r) => r.topic === topic),
        complaints = related.filter((r) => r.kind === "complaint");
      return {
        topic,
        count: complaints.length,
        ideas: related.filter((r) => r.kind === "idea").length,
        reportIds: related.map((r) => r.id),
        summary: complaints.length
          ? complaints
              .slice(0, 3)
              .map((r) => r.title)
              .join(" · ")
          : related.length
            ? "Ideas submitted; no complaints in this topic."
            : "No reports in this topic.",
      };
    })
    .filter((s) => s.count || s.ideas)
    .sort(
      (a, b) =>
        b.count - a.count ||
        b.ideas - a.ideas ||
        a.topic.localeCompare(b.topic),
    );
}
export const populationEvidence = {
  krakow: { value: 809168, year: 2024, source: "krakow-population" },
  helsinki: { value: 684018, year: 2024, source: "helsinki-population" },
};
export function compareFactors(
  profile: CommunityProfile,
  civic: CivicWorkspace,
  example: ImplementationExample,
) {
  const context = allowed(civic, "context"),
    resources = allowed(civic, "resources");
  const factors: CivicOpportunity["factors"] = [
    {
      name: "Local need",
      state: "aligned",
      detail: `The project addresses ${topicLabels[example.domain].toLowerCase()}. Topic relevance is not evidence of an outcome.`,
    },
  ];
  if (context && profile.id === "krakow" && example.id === "helsinki-info") {
    const delta = Math.round(
      (1 -
        populationEvidence.helsinki.value / populationEvidence.krakow.value) *
        100,
    );
    factors.push({
      name: "Population scale",
      state: "aligned",
      detail: `2024 municipal populations: Kraków 809,168; Helsinki 684,018 (${delta}% smaller). Same reporting year; useful context, not proof of transferability.`,
      sources: ["krakow-population", "helsinki-population"],
    });
  } else
    factors.push({
      name: "Population scale",
      state: "unknown",
      detail:
        "A comparable, same-year municipal population pair has not been established for this comparison. No similarity is assumed.",
    });
  const reuse = context
    ? profile.existingInitiatives.filter((i) =>
        example.reuse.some((k) =>
          i
            .toLowerCase()
            .includes(k === "library" ? "bibliot" : k === "parks" ? "park" : k),
        ),
      )
    : [];
  factors.push({
    name: "Existing local initiatives",
    state: reuse.length ? "aligned" : "unknown",
    detail: reuse.length
      ? `Potential connection: ${reuse.join("; ")}. Operator permission and suitability remain to be checked.`
      : context
        ? "No verified connection to a local initiative has been established."
        : "Municipal context is not shared with this run.",
    sources: context ? profile.sources : [],
  });
  for (const p of example.preconditions) {
    const value = resources ? profile.assets[p.asset] : "unknown";
    factors.push({
      name: assetLabels[p.asset],
      state:
        value === "yes" ? "aligned" : value === "no" ? "blocked" : "unknown",
      detail:
        value === "yes"
          ? "Recorded as available by the advisor; still needs site-specific verification."
          : value === "no"
            ? "Recorded as unavailable by the advisor. Hold this approach until a suitable alternative is evidenced."
            : p.explanation,
    });
  }
  factors.push({
    name: "Budget, staff & delivery",
    state:
      resources &&
      (profile.resources.budget === "none" ||
        profile.resources.staff === "none")
        ? "blocked"
        : "unknown",
    detail: !resources
      ? "Resource data was withheld from this run."
      : "Source projects do not establish a transferable local cost or schedule. Confirm an estimate, operator and delivery capacity.",
  });
  factors.push({
    name: "Climate & urban setting",
    state: "unknown",
    detail:
      "A city name or population match does not establish equivalent climate, urban form or neighbourhood needs. Compare these at the proposed local site.",
  });
  factors.push({
    name: "Authority & delivery permissions",
    state: "unknown",
    detail: civic.authority.confirmed
      ? `${civic.authority.name} is the advisor-confirmed review body. Institutional membership, site permissions and responsibility for delivery are not verified.`
      : "The responsible public body still needs advisor confirmation. No delivery permission or municipal endorsement is assumed.",
  });
  factors.push({
    name: "Municipal evidence",
    state: "aligned",
    detail: `Documented by ${example.sources
      .map((id) => getSource(id)?.publisher)
      .filter(Boolean)
      .join(" / ")}. ${example.fact.asOf}.`,
    sources: example.sources,
  });
  return factors;
}
export function buildOpportunities(
  profile: CommunityProfile,
  civic: CivicWorkspace,
  signals: TopicSignal[],
): CivicOpportunity[] {
  if (!allowed(civic, "catalogue")) return [];
  const active = signals
    .filter((s) => s.topic !== "unknown")
    .map((s) => s.topic);
  const topics = active.length
    ? active
    : allowed(civic, "context")
      ? profile.problems
      : [];
  return examples
    .filter((e) => topics.includes(e.domain))
    .map((e) => {
      const factors = compareFactors(profile, civic, e),
        blocked = factors.some((f) => f.state === "blocked"),
        unknown = factors.some((f) => f.state === "unknown");
      return {
        exampleId: e.id,
        topic: e.domain,
        reportCount: signals.find((s) => s.topic === e.domain)?.count || 0,
        state: blocked ? "hold" : unknown ? "investigate" : "ready",
        factors,
        reason: blocked
          ? "A stated local constraint blocks this approach."
          : unknown
            ? "Relevant evidence found; local feasibility still needs investigation."
            : "The recorded checks align. An advisor must review before any pilot.",
      } as CivicOpportunity;
    })
    .sort(
      (a, b) =>
        b.reportCount - a.reportCount ||
        { ready: 0, investigate: 1, hold: 2 }[a.state] -
          { ready: 0, investigate: 1, hold: 2 }[b.state],
    );
}
export function triageIdeas(
  reports: CivicReport[],
  opportunities: CivicOpportunity[],
): IdeaTriage[] {
  return reports
    .filter((r) => r.kind === "idea")
    .map((r) => {
      const matched = opportunities.filter((o) => o.topic === r.topic);
      const ready = matched.filter((o) => o.state === "ready");
      return {
        reportId: r.id,
        state:
          r.status === "received" && !r.duplicateOf && ready.length
            ? "review"
            : "hold",
        reason: r.duplicateOf
          ? "Exact duplicate; retained for traceability, not counted twice."
          : r.status === "needs-review"
            ? "Needs intake review before analysis."
            : !matched.length
              ? "No documented approach in this library covers the topic yet."
              : !ready.length
                ? "Local prerequisites are unresolved or blocked. Held out of the decision queue."
                : "Documented approaches and recorded local checks align; sent for advisor review.",
        exampleIds: matched.map((o) => o.exampleId),
      };
    });
}
export function runFingerprint(
  profile: CommunityProfile,
  civic: CivicWorkspace,
) {
  return JSON.stringify({
    profile,
    authority: civic.authority,
    connections: civic.connections,
    documents: civic.documents,
    reports: civic.reports,
  });
}
export async function localAnalysis(
  profile: CommunityProfile,
  civic: CivicWorkspace,
  onStep: (step: AgentStep) => void,
): Promise<AgentRun> {
  const start = new Date().toISOString(),
    run: AgentRun = {
      id: crypto.randomUUID(),
      startedAt: start,
      completedAt: start,
      mode: "local",
      status: "complete",
      fingerprint: runFingerprint(profile, civic),
      steps: [],
      signals: [],
      opportunities: [],
      ideas: [],
      reportCount: 0,
    };
  const reports = allowed(civic, "reports") ? civic.reports : [];
  for (const def of agentDefinitions) {
    const step: AgentStep = {
      id: def.id,
      title: def.name,
      status: "running",
      startedAt: new Date().toISOString(),
      input: "",
      output: "",
      citations: [],
    };
    onStep({ ...step });
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => resolve()),
    );
    if (def.id === "listener") {
      run.signals = summarizeReports(reports);
      run.reportCount = reports.filter(
        (r) => !r.duplicateOf && r.status === "received",
      ).length;
      step.input = `${reports.length} reports shared by the municipal data steward`;
      step.output = run.signals.length
        ? run.signals
            .map(
              (s) =>
                `${topicLabels[s.topic]}: ${s.count} complaint${s.count === 1 ? "" : "s"}, ${s.ideas} idea${s.ideas === 1 ? "" : "s"}. ${s.summary}`,
            )
            .join("\n")
        : "No eligible resident submissions. The municipal brief may provide a starting focus; it is not a claim about resident demand.";
    }
    if (def.id === "context") {
      step.input = allowed(civic, "context")
        ? `${profile.name} municipal profile`
        : "No municipal context shared";
      step.output = allowed(civic, "context")
        ? `${civic.authority.name || profile.name} · ${civic.authority.kind}\nAuthority profile ${civic.authority.confirmed ? "confirmed by the advisor; institutional identity not verified" : "awaiting advisor confirmation"}.\n${profile.context.geography || "Local geography not recorded."}\n${profile.note ? `Advisor brief: ${profile.note.slice(0, 600)}\n` : ""}${profile.existingInitiatives.length ? profile.existingInitiatives.join("\n") : "No existing initiatives entered."}\n${civic.documents
            .filter((d) => d.enabled)
            .map(
              (d) =>
                `Shared document: ${d.title} (${d.text.length} characters). ${d.text.slice(0, 240)}`,
            )
            .join("\n")}`
        : "Context access is disabled. No geography, population similarity or initiative connection is inferred.";
      step.citations = (allowed(civic, "context") ? profile.sources || [] : [])
        .map(getSource)
        .filter((s) => !!s)
        .map((s) => ({ url: s.url, title: s.title }));
    }
    if (def.id === "scout") {
      run.opportunities = buildOpportunities(profile, civic, run.signals);
      step.input = allowed(civic, "catalogue")
        ? `${examples.length} documented projects in the curated repository`
        : "Project repository access withheld";
      step.output = `${run.opportunities.length} topic-relevant approaches retrieved. ${run.opportunities.map((o) => examples.find((e) => e.id === o.exampleId)?.origin.name).join(", ")}.\nLocal catalogue search only. This run did not search the live web.`;
      step.citations = [
        ...new Set(
          run.opportunities.flatMap(
            (o) => examples.find((e) => e.id === o.exampleId)?.sources || [],
          ),
        ),
      ]
        .map(getSource)
        .filter((s) => !!s)
        .map((s) => ({ url: s.url, title: s.title }));
    }
    if (def.id === "reviewer") {
      run.ideas = triageIdeas(reports, run.opportunities);
      step.input = `${run.opportunities.length} approaches and ${reports.filter((r) => r.kind === "idea").length} submitted ideas`;
      step.output =
        run.opportunities
          .map(
            (o) =>
              `${examples.find((e) => e.id === o.exampleId)?.origin.name}: ${o.reason}\n${o.factors
                .filter((f) => f.state === "blocked" || f.state === "unknown")
                .map((f) => f.name)
                .join("; ")}`,
          )
          .join("\n\n") ||
        "No candidate to assess. Add local context or eligible reports and share the project repository.";
    }
    if (def.id === "writer") {
      step.input =
        "Ranked reports, documented approaches and explicit transfer checks";
      step.output = `${profile.name}: ${run.reportCount} eligible submissions inform ${run.signals.length} reported topics.\n${run.opportunities.length} source-backed research leads; ${run.opportunities.filter((o) => o.state === "hold").length} blocked by recorded constraints.\n${run.ideas.filter((i) => i.state === "hold").length} submitted ideas held for more evidence.\nNext: inspect a fit assessment, resolve the missing local evidence and record an advisor decision. No project is approved or sent to a municipality.`;
    }
    step.status = "complete";
    step.completedAt = new Date().toISOString();
    run.steps.push(step);
    onStep({ ...step });
  }
  run.completedAt = new Date().toISOString();
  return run;
}
