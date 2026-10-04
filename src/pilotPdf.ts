import { jsPDF } from "jspdf";
import { t } from "./i18n";

export const pilotFilename = (name: string) =>
  `elsewhere-${
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/gi, "l")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "community"
  }-pilot`;

/** Lay out the same complete export as Markdown, with selectable Unicode text. */
export function buildPilotPdf(text: string, font: string, city: string) {
  const doc = new jsPDF({ format: "a4", unit: "mm", compress: true });
  doc.addFileToVFS("Manrope.ttf", font);
  doc.addFont("Manrope.ttf", "Manrope", "normal");
  doc.setFont("Manrope");
  doc.setProperties({
    title: `${city} - ${t("Working pilot brief")}`,
    author: "Elsewhere",
    subject: t("Proposed local pilot; requires municipal review"),
  });
  const margin = 19,
    width = 172,
    bottom = 273;
  let y = 37;
  function header() {
    doc.setFillColor(23, 60, 52);
    doc.rect(0, 0, 210, 23, "F");
    doc.setTextColor(223, 237, 131);
    doc.setFontSize(15);
    doc.text("elsewhere", margin, 14);
    doc.setFontSize(8);
    doc.text(t("WORKING PILOT BRIEF"), 191, 14, { align: "right" });
  }
  function nextPage() {
    doc.addPage();
    y = 37;
    header();
  }
  header();
  // Render plain text only: authored text is never interpreted as HTML or code.
  for (const raw of text.split("\n")) {
    const heading = raw.match(/^(#{1,3})\s+(.*)$/);
    const level = heading?.[1].length || 0;
    const value = (heading ? heading[2] : raw).replace(
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,
      "",
    );
    if (!value.trim()) {
      y = Math.min(y + 3, bottom);
      continue;
    }
    const size = level === 1 ? 23 : level === 2 ? 12 : level === 3 ? 10 : 9;
    const leading = level === 1 ? 10 : level ? 6 : 4.8;
    doc.setFontSize(size);
    const lines: string[] = doc.splitTextToSize(value, width);
    if (!level && lines.length <= 10 && y + lines.length * leading > bottom)
      nextPage();
    if (level) {
      // Keep headings with at least two lines of the following paragraph.
      if (y + lines.length * leading + 16 > bottom) nextPage();
      y += level === 1 ? 2 : 7;
      doc.setDrawColor(183, 198, 177);
      if (level === 2) doc.line(margin, y - 4, 191, y - 4);
    }
    doc.setTextColor(level ? 23 : 49, level ? 60 : 66, level ? 52 : 59);
    const url = /^https?:\/\/\S+$/.test(value.trim())
      ? value.trim()
      : undefined;
    for (const line of lines) {
      if (y + leading > bottom) nextPage();
      // Headers switch font settings when a long paragraph crosses a page.
      doc.setFontSize(size);
      doc.setTextColor(level ? 23 : 49, level ? 60 : 66, level ? 52 : 59);
      doc.text(line, margin, y);
      if (url)
        doc.link(
          margin,
          y - 3.5,
          Math.min(width, doc.getTextWidth(line)),
          leading,
          { url },
        );
      y += leading;
    }
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(183, 198, 177);
    doc.line(margin, 282, 191, 282);
    doc.setTextColor(75, 92, 80);
    doc.setFontSize(8);
    doc.text(t("Working proposal · not municipal approval"), margin, 288);
    doc.text(`${page} / ${count}`, 191, 288, { align: "right" });
  }
  return doc;
}
export async function downloadPilotPdf(text: string, city: string) {
  const response = await fetch("/fonts/Manrope-PDF.ttf");
  if (!response.ok) throw Error("PDF font unavailable");
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  buildPilotPdf(text, btoa(binary), city).save(`${pilotFilename(city)}.pdf`);
}
