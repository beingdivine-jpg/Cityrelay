import type { CommunityProfile, LocalCheck } from "./model";
import { examples } from "./data";
import { assessCase } from "./matching";

export const sampleBudget =
  "Demo assumption: PLN 25,000 for a six-week discovery and small pilot. PLN 8,000 for temporary equipment, PLN 7,000 for staffing, PLN 5,000 for access and communication, and PLN 5,000 contingency. No city allocation or supplier quote is confirmed.";
const notes: Record<string, [string, string]> = {
  budget: ["Demo finance advisor", sampleBudget],
  staff: [
    "Demo service coordinator",
    "Demo assumption: one pilot coordinator for one day per week, with two site staff sharing opening and closing duties. Availability and operating costs still require confirmation.",
  ],
  timing: [
    "Demo pilot lead",
    "Demo assumption: six weeks. Weeks 1–2: site visit and consultation; week 3: permissions and quotes; weeks 4–5: a limited trial if approved; week 6: review access, effort and resident feedback. No delivery dates are committed.",
  ],
  authority: [
    "Demo public-space advisor",
    "Demo planning note: ask Gmina Miejska Kraków and the relevant site operator to establish responsibility, written access permission and maintenance arrangements. No permission or municipal endorsement has been obtained.",
  ],
  climate: [
    "Demo research advisor",
    "Demo planning note: compare the documented approach with Kraków’s seasonal conditions and the needs of the proposed neighbourhood. A local site visit and baseline measurements are still needed; outcomes from another city are not a local forecast.",
  ],
};
export function demoCheck(key: string): Omit<LocalCheck, "at"> {
  const [owner, evidence] = notes[key] || [
    "Demo site advisor",
    "Demo assumption: investigate an existing public site with its operator, checking access, capacity, opening hours, safety and maintenance. No particular site, asset availability or agreement has been verified.",
  ];
  return { owner, evidence, state: "unknown", provenance: "demo" };
}
/** Add only missing rehearsal notes. Never overwrite authored findings or real work. */
export function withDemoReality(profile: CommunityProfile): CommunityProfile {
  if (profile.id !== "krakow-demo") return profile;
  let changed = false;
  const localChecks = { ...profile.localChecks };
  for (const example of examples) {
    const checks = { ...localChecks[example.id] };
    for (const { key } of assessCase(profile, example).readiness) {
      if (checks[key]) continue;
      checks[key] = { ...demoCheck(key), at: "2026-10-04T09:00:00.000Z" };
      changed = true;
    }
    localChecks[example.id] = checks;
  }
  return changed ? { ...profile, localChecks } : profile;
}
