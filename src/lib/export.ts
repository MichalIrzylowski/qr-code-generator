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
 * The printed size of a PDF export, in points (1pt = 1/72"). A vector PDF has no
 * resolution to choose, so the pixel size selector is meaningless here — it is
 * a physical size instead, and 144pt is a 2" square: comfortable to scan and
 * comfortable to place on a page.
 */
const PDF_SIZE_PT = 144;

/**
 * Write the PDF as vector by converting the SVG, rather than embedding a raster
 * (ADR-0002). Both libraries are imported here so their weight only loads when
 * someone actually exports a PDF.
 */
const exportPdf = async (svg: string, basename: string): Promise<void> => {
  const [{ jsPDF }, { svg2pdf }] = await Promise.all([import("jspdf"), import("svg2pdf.js")]);

  const document_ = new jsPDF({
    unit: "pt",
    format: [PDF_SIZE_PT, PDF_SIZE_PT],
    orientation: "portrait",
  });

  const parsed = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
  await svg2pdf(parsed as unknown as Element, document_, {
    width: PDF_SIZE_PT,
    height: PDF_SIZE_PT,
  });
  document_.save(`${basename}.pdf`);
};

export const runExport = async (
  target: ExportTarget,
  svg: string,
  size: number,
  basename: string,
): Promise<void> => {
  if (target === "svg") {
    downloadText(svg, `${basename}.svg`, "image/svg+xml");
    return;
  }

  if (target === "pdf") {
    await exportPdf(svg, basename);
    return;
  }

  const dataUrl = await rasterise(svg, target, size);
  downloadDataUrl(dataUrl, `${basename}.${target === "jpeg" ? "jpg" : "png"}`);
};
