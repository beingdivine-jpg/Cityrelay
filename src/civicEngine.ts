import type { CommunityProfile, ImplementationExample } from "./model";
import type {
  AgentKey,
  AgentRun,
  AgentStep,
  AgentEvent,
  CivicOpportunity,
  CivicReport,
  CivicTopic,
  CivicWorkspace,
  DatasetKey,
  IdeaTriage,
  TopicSignal,
} from "./civicModel";
import { examples } from "./data";
import { assessCase, initiativeMatches } from "./matching";
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
      name: ["krakow", "krakow-demo"].includes(profile.id)
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
  area?: string,
  kind?: CivicReport["kind"],
  topic?: CivicTopic,
) {
  return reports.find(
    (r) =>
      normalize(r.title + " " + r.detail) === normalize(title + " " + detail) &&
      (area === undefined || normalize(r.area) === normalize(area)) &&
      (kind === undefined || r.kind === kind) &&
      (topic === undefined || r.topic === topic),
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
  if (
    context &&
    ["krakow", "krakow-demo"].includes(profile.id) &&
    example.id === "helsinki-info"
  ) {
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
        example.reuse.some((k) => initiativeMatches(i, k)),
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
  const masked = resources
    ? profile
    : {
        ...profile,
        assets: Object.fromEntries(
          Object.keys(profile.assets).map((k) => [k, "unknown"]),
        ) as CommunityProfile["assets"],
        resources: { budget: "unknown" as const, staff: "unknown" as const },
        localChecks: undefined,
      };
  for (const check of assessCase(masked, example).readiness) {
    factors.push({
      name: check.label,
      checkKey: check.key,
      state:
        check.state === "met"
          ? "aligned"
          : check.state === "unmet"
            ? "blocked"
            : "unknown",
      detail: check.explanation,
    });
  }
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
  const topics = [
    ...new Set([
      ...active,
      ...(allowed(civic, "context") ? profile.problems : []),
    ]),
  ];
  return examples
    .filter((e) => topics.includes(e.domain))
    .map((e) => {
      const factors = compareFactors(profile, civic, e),
        blocked = factors.some((f) => f.state === "blocked"),
        unknown = factors.some((f) => f.checkKey && f.state === "unknown");
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
          { ready: 0, investigate: 1, hold: 2 }[b.state] ||
        assessCase(
          profile,
          examples.find((e) => e.id === b.exampleId)!,
          civic,
        ).rank -
          assessCase(
            profile,
            examples.find((e) => e.id === a.exampleId)!,
            civic,
          ).rank,
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
      const ready = matched.filter((o) => o.state !== "hold");
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
                ? "Recorded constraints block the documented approaches. Review the constraint or add an alternative."
                : "A documented approach is relevant. Ready for advisor review; implementation checks may still be unresolved.",
        exampleIds: matched.map((o) => o.exampleId),
      };
    });
}
export function runFingerprint(
  profile: CommunityProfile,
  civic: CivicWorkspace,
) {
  const input = JSON.stringify({
    profile,
    authority: civic.authority,
    connections: civic.connections,
    documents: civic.documents,
    reports: civic.reports,
  });
  // Compact change detector, not a security hash. Never retain full private inputs in run fingerprints.
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < input.length; i++) {
    a = Math.imul(a ^ input.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ input.charCodeAt(i);
  }
  return `v3:${input.length}:${(a >>> 0).toString(16)}:${(b >>> 0).toString(16)}`;
}
export async function localAnalysis(
  profile: CommunityProfile,
  civic: CivicWorkspace,
  onStep: (step: AgentStep) => void,
  options: {
    signal?: AbortSignal;
    beforeStep?: (agent: AgentKey) => Promise<void>;
    onEvent?: (event: AgentEvent) => void;
    afterEvent?: (event: AgentEvent) => Promise<void>;
    checkSources?: (
      emit: (event: Omit<AgentEvent, "id" | "at" | "agent">) => void,
    ) => Promise<void>;
  } = {},
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
      events: [],
    };
  const reports = allowed(civic, "reports") ? civic.reports : [];
  for (const def of agentDefinitions) {
    await options.beforeStep?.(def.id);
    options.signal?.throwIfAborted();
    const record = (event: Omit<AgentEvent, "id" | "at" | "agent">) => {
      const item: AgentEvent = {
        ...event,
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        agent: def.id,
      };
      run.events!.push(item);
      options.onEvent?.(item);
      return item;
    };
    // Local work yields after each recorded action. Network callbacks bypass
    // reading pace so their timestamps remain the actual response times.
    const emit = async (event: Omit<AgentEvent, "id" | "at" | "agent">) => {
      options.signal?.throwIfAborted();
      const item = record(event);
      await options.afterEvent?.(item);
      options.signal?.throwIfAborted();
    };
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
    if (def.id === "listener") {
      await emit({
        kind: "input",
        title: "Opening permitted resident input",
        detail: `${reports.length} reports shared by the municipal data steward`,
      });
      for (const report of reports)
        await emit({
          kind: "check",
          title: report.duplicateOf
            ? "Duplicate excluded from counts"
            : report.status === "needs-review"
              ? "Held for intake review"
              : report.kind === "idea"
                ? "Idea kept separate from complaints"
                : "Concern included in topic grouping",
          detail: report.title,
        });
      run.signals = summarizeReports(reports);
      for (const signal of run.signals)
        await emit({
          kind: "check",
          title: "Resident topic grouped",
          detail: `${topicLabels[signal.topic]}: ${signal.count} complaint${signal.count === 1 ? "" : "s"}, ${signal.ideas} idea${signal.ideas === 1 ? "" : "s"}. ${signal.summary}`,
        });
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
      await emit({
        kind: "input",
        title: "Opening the municipal profile",
        detail: allowed(civic, "context")
          ? profile.name
          : "No municipal context shared",
      });
      if (allowed(civic, "context"))
        for (const document of civic.documents.filter((d) => d.enabled))
          await emit({
            kind: "input",
            title: "Reading a shared local document",
            detail: document.title,
          });
      for (const connection of civic.connections)
        await emit({
          kind: "input",
          title: connection.enabled
            ? "Data access enabled"
            : "Data access withheld",
          detail: datasetLabels[connection.key],
        });
      step.input = allowed(civic, "context")
        ? `${profile.name} municipal profile`
        : "No municipal context shared";
      step.output = allowed(civic, "context")
        ? `${civic.authority.name || profile.name} · ${civic.authority.kind}\nAuthority profile ${civic.authority.confirmed ? "confirmed by the advisor; institutional identity not verified" : "awaiting advisor confirmation"}.\n${profile.context.geography || "Local geography not recorded."}\n${profile.note ? `Advisor brief: ${profile.note.slice(0, 600)}\n` : ""}${profile.existingInitiatives.length ? profile.existingInitiatives.join("\n") : "No existing initiatives entered."}\n${civic.documents
            .filter((d) => d.enabled)
            .map(
              (d) =>
                `Shared document: ${d.title} (${d.text.length} characters). ${d.text.slice(0, 600)}`,
            )
            .join("\n")}`
        : "Context access is disabled. No geography, population similarity or initiative connection is inferred.";
      step.citations = (allowed(civic, "context") ? profile.sources || [] : [])
        .map(getSource)
        .filter((s) => !!s)
        .map((s) => ({ url: s.url, title: s.title }));
    }
    if (def.id === "scout") {
      await emit({
        kind: "query",
        title: "Searching the documented project library",
        detail: allowed(civic, "catalogue")
          ? [
              ...new Set([
                ...run.signals.map((s) => topicLabels[s.topic]),
                ...(allowed(civic, "context")
                  ? profile.problems.map((p) => topicLabels[p])
                  : []),
              ]),
            ].join(" · ")
          : "Project repository access withheld",
      });
      run.opportunities = buildOpportunities(profile, civic, run.signals);
      for (const opportunity of run.opportunities) {
        const example = examples.find((e) => e.id === opportunity.exampleId)!;
        await emit({
          kind: "source",
          title: "Documented candidate retrieved",
          detail: `${example.origin.name} · ${example.shortTitle}`,
          url: getSource(example.sources[0])?.url,
        });
      }
      for (const signal of run.signals.filter(
        (s) => !run.opportunities.some((o) => o.topic === s.topic),
      ))
        await emit({
          kind: "check",
          title: "Evidence gap kept visible",
          detail: topicLabels[signal.topic],
        });
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
      if (options.checkSources && allowed(civic, "catalogue")) {
        step.output = step.output.replace(
          "Local catalogue search only. This run did not search the live web.",
          "Catalogue retrieval is complete. Live source-page checks are listed in the activity log. No broader web discovery was run.",
        );
        try {
          await options.checkSources((event) => {
            record(event);
          });
        } catch (e) {
          if (options.signal?.aborted) throw e;
          await emit({
            kind: "error",
            title: "Live source check unavailable",
            detail:
              "Documented records remain available. No current page check is claimed.",
          });
        }
        options.signal?.throwIfAborted();
      }
    }
    if (def.id === "reviewer") {
      run.ideas = triageIdeas(reports, run.opportunities);
      for (const idea of run.ideas)
        await emit({
          kind: "check",
          title:
            idea.state === "review"
              ? "Resident idea routed to human review"
              : "Resident idea held for evidence",
          detail:
            reports.find((r) => r.id === idea.reportId)?.title || idea.reason,
        });
      for (const o of run.opportunities)
        for (const factor of o.factors)
          await emit({
            kind: "check",
            title: `${examples.find((e) => e.id === o.exampleId)!.origin.name} · ${factor.name}`,
            detail: `${factor.state.toUpperCase()}: ${factor.detail}`,
          });
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
      await emit({
        kind: "input",
        title: "Assembling the advisor brief",
        detail:
          "Ranked reports, documented approaches and explicit transfer checks",
      });
      for (const opportunity of run.opportunities)
        await emit({
          kind: "check",
          title: "Adding a lead and its unresolved conditions",
          detail: `${examples.find((e) => e.id === opportunity.exampleId)!.origin.name} · ${opportunity.reason}`,
        });
      step.input =
        "Ranked reports, documented approaches and explicit transfer checks";
      step.output = `${profile.name}: ${run.reportCount} eligible submissions inform ${run.signals.length} reported topics.\n${run.opportunities.length} source-backed research leads; ${run.opportunities.filter((o) => o.state === "hold").length} blocked by recorded constraints.\n${run.ideas.filter((i) => i.state === "hold").length} submitted ideas held for more evidence.\nNext: inspect a fit assessment, resolve the missing local evidence and record an advisor decision. No project is approved or sent to a municipality.`;
    }
    await emit({
      kind: "output",
      title: "Stage output recorded",
      detail: step.output,
    });
    step.status = "complete";
    step.completedAt = new Date().toISOString();
    run.steps.push(step);
    onStep({ ...step });
    await emit({
      kind: "handoff",
      title: def.id === "writer" ? "Ready for advisor review" : "Handoff ready",
      detail:
        def.id === "writer"
          ? "No project has been approved or sent to a municipality."
          : agentDefinitions[
              agentDefinitions.findIndex((a) => a.id === def.id) + 1
            ].name,
    });
  }
  run.completedAt = new Date().toISOString();
  return run;
}
