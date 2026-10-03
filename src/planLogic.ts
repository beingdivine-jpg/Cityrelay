import { t } from "./i18n";
import type {
  AppState,
  CommunityProfile,
  ImplementationExample,
  PilotPlan,
} from "./model";
import { assessCase } from "./matching";
import { assetLabels, examples, localSuggestion } from "./data";
import { getSource } from "./sources";
export function createPlan(
  profile: CommunityProfile,
  example: ImplementationExample,
  contextSnapshot?: string,
): PilotPlan {
  const plan: PilotPlan = {
    id: `plan-${profile.id}`,
    communityId: profile.id,
    selectedExamples: [example.id],
    goal:
      (profile.problems.includes(example.domain)
        ? profile.goals.objective
        : "") ||
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
  for (const key of [
    "adaptations",
    "prerequisites",
    "roleAssignments",
    "schedule",
    "proposal",
  ] as const)
    plan[key] = t(plan[key]);
  if (!profile.goals.objective || !profile.problems.includes(example.domain))
    plan.goal = t(plan.goal);
  return plan;
}
export function exportPlan(
  profile: CommunityProfile,
  plan: PilotPlan,
  state: AppState,
): string {
  const selected = plan.selectedExamples
    .map((id) => examples.find((e) => e.id === id))
    .filter((e): e is ImplementationExample => !!e);
  const matches = selected.map((e) =>
    assessCase(profile, e, state.civic?.[profile.id]),
  );
  const references = [
    ...new Set([
      ...(profile.sources || []),
      ...selected.flatMap((e) => e.sources),
    ]),
  ]
    .map(getSource)
    .filter((s) => !!s);
  return `# ${profile.name || "Your community"} — ${t("proposed local pilot")}\n\n${t(plan.reviewStatus)} • ${t("An Elsewhere working proposal, not an approved municipal project")}\n${t("Responsible authority in the profile")}: ${profile.authorityType}\n\n## ${t("Documented projects informing this proposal")}\n${selected.map((e) => `- ${t(e.title)} — ${e.origin.name}, ${t(e.origin.country)} (${t(e.evidenceType)})`).join("\n")}\n\n## ${t("Proposed local objective")}\n${plan.goal}\n\n## ${t("Proposed action")}\n${plan.proposal}\n\n## ${t("Existing initiatives to consult")}\n${plan.retainedInitiatives}\n\n## ${t("Proposed local adaptations")}\n${plan.adaptations}\n\n## ${t("Unresolved local checks")}\n${selected
    .map((ex) => {
      const a = matches.find((m) => m.example.id === ex.id);
      return `${t(ex.shortTitle)}:\n${
        a
          ? a.readiness
              .filter((c) => c.state !== "met")
              .map(
                (c) =>
                  `- ${t(c.state.toUpperCase())}: ${t(c.label)}. ${t(c.explanation)}`,
              )
              .join("\n") ||
            t(
              "Listed checks entered as met by the user; site-specific confirmation still required.",
            )
          : t("No longer matches your selected focus. Reassess.")
      }`;
    })
    .join(
      "\n\n",
    )}\n\n## ${t("Local prerequisite notes")}\n${plan.prerequisites}\n\n## ${t("Proposed roles")}\n${plan.roleAssignments}\n\n## ${t("Proposed sequence / timeline")}\n${plan.schedule}\n\n## ${t("Intended evaluation")}\n${plan.metrics.map((m) => `- ${t(m)}`).join("\n")}\n\n## ${t("Source-reported facts (not local predictions)")}\n${selected.map((e) => `${e.origin.name} — ${t(e.shortTitle)}\n${e.reportedOutcomes.map((r) => `- ${t(r)}`).join("\n")}\n${t("Limitations")}: ${t(e.limitations)}`).join("\n\n")}\n\n## ${t("Weather context saved with this draft")}\n${t(plan.contextSnapshot || "No live context was captured. No weather values are assumed.")}\n\n## ${t("Sources")}\n${references.map((s) => `- ${s.publisher}: ${s.title}\n  ${t("Published")}: ${t(s.published)}. ${t("Checked")}: ${s.checked}.\n  ${s.url}`).join("\n")}\n\n## ${t("User-reported observations — unverified")}\n${
    state.outcomes
      .filter((o) => o.planId === plan.id)
      .map(
        (o) =>
          `### ${o.date}\n${t("Action")}: ${o.action}\n${t("Observed")}: ${o.observations}\n${t("Effort")}: ${o.effort}\n${t("Obstacles")}: ${o.obstacles}\n${t("Lessons")}: ${o.lessons}\n${t("Provenance")}: ${t(o.provenance)}`,
      )
      .join("\n\n") || t("No observations recorded.")
  }\n\n${t("Published project facts, live weather context and proposed local actions are distinct. Local suitability, costs, delivery times and outcomes require local evidence.")}\n`;
}

/** Adding evidence never replaces an advisor's existing writing. */
export function addPlanExample(prior: PilotPlan, exampleId: string): PilotPlan {
  return {
    ...prior,
    selectedExamples: [...new Set([...prior.selectedExamples, exampleId])],
  };
}
export function checkpointPlan(plan: PilotPlan): PilotPlan {
  const { revisions, ...snapshot } = plan;
  return {
    ...plan,
    revisions: [
      {
        at: new Date().toISOString(),
        proposal: plan.proposal,
        goal: plan.goal,
        snapshot,
      },
      ...(plan.revisions || []),
    ].slice(0, 20),
  };
}
