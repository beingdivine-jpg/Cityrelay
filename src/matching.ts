import {
  assetLabels,
  budgetLabels,
  staffLabels,
  localSuggestion,
} from "./data";
import type {
  CommunityProfile,
  ImplementationExample,
  MatchAssessment,
  ReadinessCheck,
  RelevantEvent,
} from "./model";
const budgets = {
  none: 0,
  micro: 1,
  small: 2,
  medium: 3,
  capital: 4,
  unknown: -1,
};
const staff = { none: 0, limited: 1, shared: 2, dedicated: 3, unknown: -1 };
export function assessMatches(
  profile: CommunityProfile,
  examples: ImplementationExample[],
  _events: RelevantEvent[] = [],
  _now = Date.now(),
): MatchAssessment[] {
  return examples
    .filter(
      (ex) =>
        profile.problems.includes(ex.domain) &&
        (profile.goals.outcome === "all" ||
          ex.outcomes.includes(profile.goals.outcome)),
    )
    .map((example) => {
      const readiness: ReadinessCheck[] = example.preconditions.map((req) => ({
        key: req.asset,
        label: assetLabels[req.asset],
        state:
          profile.assets[req.asset] === "yes"
            ? "met"
            : profile.assets[req.asset] === "no"
              ? "unmet"
              : "unknown",
        explanation: req.explanation,
      }));
      readiness.push({
        key: "budget",
        label: `Budget: ${budgetLabels[example.resourceNeeds.budget]}`,
        state:
          profile.resources.budget === "none"
            ? "unmet"
            : profile.resources.budget === "unknown" ||
                example.resourceNeeds.budget === "unknown"
              ? "unknown"
              : budgets[profile.resources.budget] >=
                  budgets[example.resourceNeeds.budget]
                ? "met"
                : "unmet",
        explanation:
          example.resourceNeeds.budget === "unknown"
            ? "No transferable local cost is established by the cited sources. Obtain a site-specific estimate; a selected budget band does not prove affordability."
            : `Your planning budget: ${budgetLabels[profile.resources.budget]}. Confirm local costs before committing.`,
      });
      readiness.push({
        key: "staff",
        label: `Staff: ${staffLabels[example.resourceNeeds.staff]}`,
        state:
          profile.resources.staff === "none"
            ? "unmet"
            : profile.resources.staff === "unknown" ||
                example.resourceNeeds.staff === "unknown"
              ? "unknown"
              : staff[profile.resources.staff] >=
                  staff[example.resourceNeeds.staff]
                ? "met"
                : "unmet",
        explanation:
          example.resourceNeeds.staff === "unknown"
            ? "The sources do not establish staffing for a local transfer. Confirm an operator and a delivery team; a selected staffing band is not a feasibility assessment."
            : `Your staffing: ${staffLabels[profile.resources.staff]}. Confirm the operating arrangements.`,
      });
      const days =
        profile.goals.horizon === "unknown"
          ? null
          : Number(profile.goals.horizon);
      readiness.push({
        key: "timing",
        label:
          example.timingDays === null
            ? "Local delivery time: to confirm"
            : `Preparation: ${example.timingDays} days`,
        state:
          example.timingDays === null || days === null
            ? "unknown"
            : example.timingDays <= days
              ? "met"
              : "unmet",
        explanation:
          example.timingDays === null
            ? "The source does not establish a transferable delivery time. Agree a local scope and schedule before claiming the project can fit your horizon."
            : `Compare the documented preparation period with your ${days ?? "unconfirmed"}-day horizon.`,
      });
      const reused = profile.existingInitiatives.filter((item) =>
        example.reuse.some((word) =>
          new RegExp(`\\b${word}\\b`, "i").test(item),
        ),
      );
      const met = readiness.filter((check) => check.state === "met");
      const unknown = readiness.filter((check) => check.state === "unknown");
      const unmet = readiness.filter((check) => check.state === "unmet");
      const same = profile.setting === example.origin.setting;
      const factors = [
        {
          label: "Priority & direction",
          value: 40,
          explanation:
            "Matches the selected problem and intended outcome (40 points).",
        },
        {
          label: "Community setting",
          value: same ? 5 : 0,
          explanation: same
            ? "The same community setting adds 5 points."
            : "A different setting is allowed. Practical requirements matter more.",
        },
        {
          label: "Existing initiatives",
          value: Math.min(reused.length, 2) * 15,
          explanation: reused.length
            ? `Builds on ${reused.join(" and ")} (15 points per initiative, up to 30).`
            : "No initiative connection identified by the explicit keyword rules.",
        },
        {
          label: "Confirmed requirements",
          value: met.length * 4 - unknown.length * 3,
          explanation: `${met.length} met (+4 each); ${unknown.length} unknown (−3 each). Unmet requirements always block readiness, regardless of points.`,
        },
      ];
      const category = unmet.length
        ? "Does not fit current constraints"
        : unknown.length
          ? "Needs confirmation"
          : "Worth exploring";
      return {
        example,
        readiness,
        category,
        factors,
        rank: factors.reduce((sum, f) => sum + f.value, 0),
        reasons: [
          reused.length
            ? `Builds on your ${reused[0]}.`
            : `Addresses your ${example.domain === "heat" ? "heat preparedness" : example.domain === "water" ? "water resilience" : "essential services"} priority.`,
          same
            ? `A comparable ${profile.setting} setting, with requirements assessed separately.`
            : `An idea from a ${example.origin.setting} is worth comparing across contexts; transfer still needs a local assessment.`,
        ],
        similarities: [
          reused.length
            ? `Your profile lists ${reused.join(" and ")}.`
            : "Both places are exploring the same priority and intended direction.",
          ...example.preconditions
            .filter((r) => profile.assets[r.asset] === "yes")
            .map(
              (r) =>
                `Available locally: ${assetLabels[r.asset].toLowerCase()}.`,
            ),
        ],
        differences: [
          ...(unmet.length
            ? unmet.map((c) => `${c.label}: requirement is not met.`)
            : []),
          ...(unknown.length
            ? unknown.map((c) => `${c.label}: still needs confirmation.`)
            : []),
          `${example.origin.name}: ${example.origin.context} Your context: ${profile.context.geography || "not yet described"}.`,
          localSuggestion(profile, example, "adaptation"),
        ],
        evidenceLimitations: example.limitations,
        question: unknown.length
          ? `What should we check to confirm ${unknown[0].label.toLowerCase()} for this approach?`
          : unmet.length
            ? `Is there a smaller version of this approach that works without ${unmet[0].label.toLowerCase()}?`
            : `What did it take to coordinate ${example.title.toLowerCase()}, and what would you check before a first pilot?`,
      } satisfies MatchAssessment;
    })
    .sort((a, b) => {
      const order = {
        "Worth exploring": 0,
        "Needs confirmation": 1,
        "Does not fit current constraints": 2,
      };
      return (
        order[a.category] - order[b.category] ||
        b.rank - a.rank ||
        a.example.title.localeCompare(b.example.title)
      );
    });
}
