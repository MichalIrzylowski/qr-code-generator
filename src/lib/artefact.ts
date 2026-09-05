import type { Font } from "opentype.js";
import { DEFAULT_CAPTION, captionLayout, type Caption } from "@/domain/caption.ts";
import type { Design } from "@/domain/design.ts";

/**
 * Composing a Caption onto a code.
 *
 * The Caption is emitted as vector *paths*, never as an SVG `<text>` element —
 * see ADR-0003. The short version: the PDF Export Target goes through jsPDF,
 * whose built-in fonts cannot represent ą, ć, ę, ł, ń, ó, ś, ź or ż, so a Polish
 * caption would silently come out as blanks in the one target that is supposed
 * to be print-ready. Paths are paths in every target.
 */
export const CAPTION_FONT_URL = `${import.meta.env.BASE_URL}fonts/inter-caption.ttf`;

let pending: Promise<Font> | null = null;

/**
 * Fetch and parse the caption font, once. Neither the font nor the parser is
 * requested until a Caption is actually non-empty, so the many users who never
 * write one pay for neither — the same lazy-import bargain the PDF target makes
 * (ADR-0002). A failure clears the cache so a later edit can retry.
 */
export const loadCaptionFont = (): Promise<Font> => {
  pending ??= (async () => {
    const [{ parse }, response] = await Promise.all([
      import("opentype.js"),
      fetch(CAPTION_FONT_URL),
    ]);
    if (!response.ok) throw new Error(`Caption font: HTTP ${response.status}`);
    return parse(await response.arrayBuffer());
  })().catch((error: unknown) => {
    pending = null;
    throw error;
  });

  return pending;
};

/** The measurer `captionLayout` needs, bound to a loaded font. */
export const measureWith =
  (font: Font) =>
  (text: string, fontSize: number): number =>
    font.getAdvanceWidth(text, fontSize);

/** The finished thing: one SVG, its intrinsic size, and no square assumption. */
export type Artefact = { svg: string; width: number; height: number };

/**
 * The size an Artefact takes when rendered `width` across.
 *
 * Every caller — raster export, PDF page, Scannability Check — chooses the
 * *code's* width and inherits whatever height the Caption added, so the ratio
 * is worked out here once rather than restated at each one.
 */
export const scaleToWidth = (
  { width, height }: Pick<Artefact, "width" | "height">,
  toWidth: number,
): { width: number; height: number } => ({
  width: toWidth,
  height: Math.round(toWidth * (height / width)),
});

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Colours reach here from a share link and a free-text field, so never trust one. */
const safeColor = (color: string, fallback: string): string =>
  HEX.test(color.trim()) ? color.trim() : fallback;

/**
 * Wrap a square code SVG in a taller one carrying the Caption beneath it.
 *
 * Returns the code untouched when there is no Caption to draw, so an artefact
 * without one is byte-identical to what the app produced before Captions
 * existed. The result feeds the preview, every Export Target *and* the
 * Scannability Check, which is what keeps "what is checked is what is exported"
 * true now that the two are no longer the same shape as the library's output.
 */
export const composeArtefact = (
  codeSvg: string,
  codeSize: number,
  design: Design,
  caption: Caption | null,
  font: Font,
): Artefact => {
  if (caption === null) return { svg: codeSvg, width: codeSize, height: codeSize };

  const layout = captionLayout(caption, codeSize, design.margin, measureWith(font));
  if (layout.lines.length === 0) return { svg: codeSvg, width: codeSize, height: codeSize };

  const { height } = layout;
  const ascent = (font.ascender / font.unitsPerEm) * layout.fontSize;
  const descent = (Math.abs(font.descender) / font.unitsPerEm) * layout.fontSize;
  // Centre each line within its line box rather than hanging it off the ascent.
  const baselineOffset = (layout.lineHeight - (ascent + descent)) / 2 + ascent;

  const glyphs = layout.lines
    .map((line, index) => {
      const width = font.getAdvanceWidth(line, layout.fontSize);
      const x = (codeSize - width) / 2;
      const y = codeSize + layout.gap + index * layout.lineHeight + baselineOffset;
      return font.getPath(line, x, y, layout.fontSize).toPathData(2);
    })
    .filter((data) => data !== "")
    .join(" ");

  // The band shares the code's background: one artefact, one surface, and the
  // JPEG-flattens-onto-white rule keeps meaning without a second special case.
  const backdrop = design.transparentBackground
    ? ""
    : `<rect width="${codeSize}" height="${height}" fill="${safeColor(design.background, "#ffffff")}"/>`;

  const text =
    glyphs === ""
      ? ""
      : `<path d="${glyphs}" fill="${safeColor(caption.color, DEFAULT_CAPTION.color)}"/>`;

  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" width="${codeSize}" height="${height}" ` +
      `viewBox="0 0 ${codeSize} ${height}">${backdrop}${codeSvg}${text}</svg>`,
    width: codeSize,
    height,
  };
};
