import type {
  AppState,
  CommunityProfile,
  ImplementationExample,
  PilotPlan,
} from "./model";
import { assessMatches } from "./matching";
import { assetLabels, examples, localSuggestion } from "./data";
import { getSource } from "./sources";
export function createPlan(
  profile: CommunityProfile,
  example: ImplementationExample,
  contextSnapshot?: string,
): PilotPlan {
  return {
    id: `plan-${profile.id}`,
    communityId: profile.id,
    selectedExamples: [example.id],
    goal:
      profile.goals.objective ||
      `Assess whether ${example.shortTitle.toLowerCase()} can address the selected local challenge. No local benefit is predicted.`,
    retainedInitiatives: [
      ...profile.existingInitiatives.filter(Boolean),
      ...example.preconditions
        .filter((p) => profile.assets[p.asset] === "yes")
        .map((p) => assetLabels[p.asset]),
    ].join("\n"),
    adaptations: localSuggestion(profile, example, "adaptation"),
    prerequisites:
      "Confirm a suitable site, delivery permission, resources, costs, operating arrangements and a local evaluation method. No site or allocation is assumed.",
    roleAssignments:
      "Responsible authority / site owner: to confirm\nPilot lead: to appoint\nOperations and maintenance: to agree\nEvaluation lead: to appoint",
    schedule:
      "Proposed sequence, dates to be agreed locally:\n1. Check the site and consult the operator.\n2. Estimate costs, capacity and permissions.\n3. Agree the scope and an evaluation baseline.\n4. Decide whether to proceed with a pilot.\n5. Review actual observations.",
    metrics: [
      "Access barriers",
      "Staff and volunteer effort",
      "Resident feedback",
    ],
    reviewStatus: "Draft",
    proposal: localSuggestion(profile, example, "proposal"),
    contextSnapshot,
  };
}
export function exportPlan(
  profile: CommunityProfile,
  plan: PilotPlan,
  state: AppState,
): string {
  const selected = plan.selectedExamples
    .map((id) => examples.find((e) => e.id === id))
    .filter((e): e is ImplementationExample => !!e);
  const matches = assessMatches(profile, examples, state.events);
  const references = [
    ...new Set([
      ...(profile.sources || []),
      ...selected.flatMap((e) => e.sources),
    ]),
  ]
    .map(getSource)
    .filter((s) => !!s);
  return `# ${profile.name || "Your community"} — proposed local pilot\n\n${plan.reviewStatus} • An Elsewhere working proposal, not an approved municipal project\nResponsible authority in the profile: ${profile.authorityType}\n\n## Documented projects informing this proposal\n${selected.map((e) => `- ${e.title} — ${e.origin.name}, ${e.origin.country} (${e.evidenceType})`).join("\n")}\n\n## Proposed local objective\n${plan.goal}\n\n## Proposed action\n${plan.proposal}\n\n## Existing initiatives to consult\n${plan.retainedInitiatives}\n\n## Proposed local adaptations\n${plan.adaptations}\n\n## Unresolved local checks\n${selected
    .map((ex) => {
      const a = matches.find((m) => m.example.id === ex.id);
      return `${ex.shortTitle}:\n${
        a
          ? a.readiness
              .filter((c) => c.state !== "met")
              .map(
                (c) =>
                  `- ${c.state.toUpperCase()}: ${c.label}. ${c.explanation}`,
              )
              .join("\n") ||
            "Listed checks entered as met by the user; site-specific confirmation still required."
          : "No longer matches your selected focus. Reassess."
      }`;
    })
    .join(
      "\n\n",
    )}\n\n## Local prerequisite notes\n${plan.prerequisites}\n\n## Proposed roles\n${plan.roleAssignments}\n\n## Proposed sequence / timeline\n${plan.schedule}\n\n## Intended evaluation\n${plan.metrics.map((m) => `- ${m}`).join("\n")}\n\n## Source-reported facts (not local predictions)\n${selected.map((e) => `${e.origin.name} — ${e.shortTitle}\n${e.reportedOutcomes.map((r) => `- ${r}`).join("\n")}\nLimitations: ${e.limitations}`).join("\n\n")}\n\n## Weather context saved with this draft\n${plan.contextSnapshot || "No live context was captured. No weather values are assumed."}\n\n## Sources\n${references.map((s) => `- ${s.publisher}: ${s.title}\n  Published: ${s.published}. Checked: ${s.checked}.\n  ${s.url}`).join("\n")}\n\n## User-reported observations — unverified\n${
    state.outcomes
      .filter((o) => o.planId === plan.id)
      .map(
        (o) =>
          `### ${o.date}\nAction: ${o.action}\nObserved: ${o.observations}\nEffort: ${o.effort}\nObstacles: ${o.obstacles}\nLessons: ${o.lessons}\nProvenance: ${o.provenance}`,
      )
      .join("\n\n") || "No observations recorded."
  }\n\nPublished project facts, live weather context and proposed local actions are distinct. Local suitability, costs, delivery times and outcomes require local evidence.\n`;
}
