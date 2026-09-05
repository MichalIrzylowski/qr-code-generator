import { scaleToWidth, type Artefact } from "./artefact.ts";
import { downloadDataUrl, downloadText } from "./download.ts";
import { rasterise } from "./qr.ts";

export type ExportTarget = "png" | "jpeg" | "svg" | "pdf";

export const EXPORT_TARGETS: { id: ExportTarget; label: string }[] = [
  { id: "png", label: "PNG" },
  { id: "jpeg", label: "JPEG" },
  { id: "svg", label: "SVG" },
  { id: "pdf", label: "PDF" },
];

/** JPEG has no alpha channel; a transparent design is flattened onto white. */
export const targetSupportsTransparency = (target: ExportTarget): boolean => target !== "jpeg";

/** SVG and PDF are vector: there is no resolution for the size selector to set. */
export const targetHasResolution = (target: ExportTarget): boolean =>
  target !== "svg" && target !== "pdf";

/**
 * The printed *width* of a PDF export, in points (1pt = 1/72"). A vector PDF has
 * no resolution to choose, so the pixel size selector is meaningless here — it
 * is a physical size instead, and 144pt is a 2" square: comfortable to scan and
 * comfortable to place on a page.
 *
 * A Caption makes the page taller; the code itself stays 144pt either way, so
 * adding a caption never shrinks the thing being scanned.
 */
const PDF_WIDTH_PT = 144;

/**
 * Write the PDF as vector by converting the SVG, rather than embedding a raster
 * (ADR-0002). Both libraries are imported here so their weight only loads when
 * someone actually exports a PDF.
 */
const exportPdf = async (artefact: Artefact, basename: string): Promise<void> => {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);

  const { height: heightPt } = scaleToWidth(artefact, PDF_WIDTH_PT);

  const document_ = new jsPDF({
    unit: "pt",
    format: [PDF_WIDTH_PT, heightPt],
    orientation: "portrait",
  });

  const parsed = new DOMParser().parseFromString(artefact.svg, "image/svg+xml").documentElement;
  await svg2pdf(parsed as unknown as Element, document_, {
    width: PDF_WIDTH_PT,
    height: heightPt,
  });
  document_.save(`${basename}.pdf`);
};

export const runExport = async (
  target: ExportTarget,
  artefact: Artefact,
  size: number,
  basename: string,
): Promise<void> => {
  if (target === "svg") {
    downloadText(artefact.svg, `${basename}.svg`, "image/svg+xml");
    return;
  }

  if (target === "pdf") {
    await exportPdf(artefact, basename);
    return;
  }

  // `size` is the *code's* width, not the artefact's height: it is the number
  // the user cares about, and holding it fixed means adding a Caption can never
  // shrink the code.
  const { width, height } = scaleToWidth(artefact, size);
  const dataUrl = await rasterise(artefact.svg, target, width, height);
  downloadDataUrl(dataUrl, `${basename}.${target === "jpeg" ? "jpg" : "png"}`);
};
