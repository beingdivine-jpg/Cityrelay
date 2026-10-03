import { afterEach, describe, expect, it } from "vitest";
import { getLanguage, setLanguage, t, translateText } from "./i18n";
import { createPlan, exportPlan } from "./planLogic";
import { examples, seedProfiles } from "./data";
import { seedState } from "./storage";
import patterns from "./locales/pl-patterns.json";

afterEach(() => setLanguage("en"));
describe("English and Polish presentation", () => {
  it("keeps English text and arbitrary resident writing intact", () => {
    expect(translateText("Agent studio", "en")).toBe("Agent studio");
    expect(translateText("Proszę o ławkę przy ulicy Długiej.", "pl")).toBe(
      "Proszę o ławkę przy ulicy Długiej.",
    );
    expect(translateText("My own library proposal, unchanged.", "pl")).toBe(
      "My own library proposal, unchanged.",
    );
  });
  it("translates interface messages with whitespace and case preserved", () => {
    expect(translateText(" Agent studio ", "pl")).toBe(" Pracownia agentów ");
    expect(translateText("SPAIN", "pl")).toBe("HISZPANIA");
  });
  it("translates dynamic explanations without losing evidence values", () => {
    expect(translateText("3 approaches and 1 submitted ideas", "pl")).toBe(
      "Podejścia: 3 · zgłoszone pomysły: 1",
    );
    expect(translateText("Elsewhere — Your pilot brief", "pl")).toBe(
      "Elsewhere — Twoje założenia pilotażu",
    );
    const result = translateText(
      "2024 municipal populations: Kraków 809,168; Helsinki 684,018 (15% smaller). Same reporting year; useful context, not proof of transferability.",
      "pl",
    );
    expect(result).toContain("Kraków 809 168; Helsinki 684 018 (o 15% mniej)");
  });
  it("keeps independent report lines and counts separate", () => {
    const output = translateText(
      "Public services: 2 complaints, 0 ideas. First concern\nWaste & cleanliness: 0 complaints, 1 idea. Second concern",
      "pl",
    );
    expect(output).toBe(
      "Usługi publiczne: zgłoszenia problemów: 2, pomysły: 0. First concern\nOdpady i czystość: zgłoszenia problemów: 0, pomysły: 1. Second concern",
    );
  });
  it("exports Polish headings and evidence without rewriting authored fields", () => {
    setLanguage("pl");
    const plan = createPlan(seedProfiles[0], examples[0]);
    plan.proposal = "Exact user draft in its original language.";
    const output = exportPlan(seedProfiles[0], plan, seedState());
    expect(output).toContain("## Proponowane działanie");
    expect(output).toContain(plan.proposal);
    expect(output).toContain("Opublikowane fakty o projektach");
    expect(output).toContain("https://");
  });
  it("supports every translated template without unresolved slots", () => {
    for (const [source, translated] of Object.entries(patterns)) {
      expect([...source.matchAll(/\{\d+\}/g)].map((x) => x[0]).sort()).toEqual(
        [...translated.matchAll(/\{\d+\}/g)].map((x) => x[0]).sort(),
      );
      expect(
        translateText(
          source.replace(/\{(\d+)\}/g, (_, i) => `VALUE${i}`),
          "pl",
        ),
      ).not.toMatch(/\{\d+\}/);
    }
  });
  it("does not mutate data models or identifiers when switching languages", () => {
    const before = JSON.stringify(seedProfiles);
    setLanguage("pl");
    expect(getLanguage()).toBe("pl");
    expect(t("Agent studio")).toBe("Pracownia agentów");
    expect(t(seedProfiles[0])).toBe(seedProfiles[0]);
    setLanguage("en");
    expect(JSON.stringify(seedProfiles)).toBe(before);
  });
  it("creates Polish pilot defaults while preserving user-authored objectives", () => {
    setLanguage("pl");
    const profile = structuredClone(seedProfiles[0]);
    profile.goals.objective = "My exact objective";
    const plan = createPlan(profile, examples[0]);
    expect(plan.goal).toBe("My exact objective");
    expect(plan.prerequisites).toContain("Potwierdź odpowiednie miejsce");
    expect(plan.retainedInitiatives).toContain(profile.existingInitiatives[0]);
  });
});
