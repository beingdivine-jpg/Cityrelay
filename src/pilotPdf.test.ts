import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildPilotPdf, pilotFilename } from "./pilotPdf";
import { setLanguage } from "./i18n";
import { createPlan, exportPlan } from "./planLogic";
import { startDemo, DEMO_ID } from "./demo";
import { seedState } from "./storage";
import { examples } from "./data";

const font = readFileSync("public/fonts/Manrope-PDF.ttf").toString("base64");
afterEach(() => setLanguage("en"));
it("paginates long authored text and preserves source links in a real PDF", () => {
  const state = startDemo(seedState());
  const profile = state.profiles.find((p) => p.id === DEMO_ID)!;
  const plan = createPlan(profile, examples[0]);
  plan.proposal = "Retain this exact user proposal. ".repeat(450);
  const doc = buildPilotPdf(
    exportPlan(profile, plan, state),
    font,
    profile.name,
  );
  expect(doc.getNumberOfPages()).toBeGreaterThan(4);
  const pdf = doc.output();
  expect(pdf).toMatch(/^%PDF-/);
  expect(pdf).toContain("/URI (https://");
  expect(pdf).toContain("/ToUnicode");
});
it("embeds Polish glyph mappings and transliterates the filename", () => {
  setLanguage("pl");
  const doc = buildPilotPdf(
    "# Kraków\nZażółć gęślą jaźń\n## Źródła\nhttps://example.org",
    font,
    "Kraków",
  );
  expect(doc.getNumberOfPages()).toBe(1);
  expect(doc.output()).toContain("/FontFile2");
  expect(pilotFilename("Kraków / Łódź")).toBe("elsewhere-krakow-lodz-pilot");
  expect(pilotFilename("///")).toBe("elsewhere-community-pilot");
});
