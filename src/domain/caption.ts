/**
 * A Caption is the human-readable line that sits beneath a QR code. It is
 * neither Payload nor Design: a scanner never sees it and a human always does,
 * so it is the one part of the artefact that carries meaning outside the code.
 *
 * Nothing here knows about fonts. Measurement is injected, which is what keeps
 * line-breaking testable without loading font bytes — and, more importantly,
 * means the same measurements drive the preview, every Export Target and the
 * Scannability Check.
 */
export type CaptionSize = "small" | "medium" | "large";

export type Caption = {
  text: string;
  color: string;
  size: CaptionSize;
};

/** Long enough for a tagline, short enough to stay legible under the code. */
export const MAX_CAPTION_LENGTH = 60;
export const MAX_CAPTION_LINES = 2;

/** Font size as a fraction of the code's width, per size step. */
export const CAPTION_SIZE_SCALE: Record<CaptionSize, number> = {
  small: 0.05,
  medium: 0.07,
  large: 0.095,
};

export const CAPTION_SIZES: readonly CaptionSize[] = ["small", "medium", "large"];

/** The breathing room between the code's quiet zone and the first caption line. */
export const CAPTION_GAP_SCALE = 0.04;
export const CAPTION_LINE_HEIGHT = 1.25;

const ELLIPSIS = "…";

export const DEFAULT_CAPTION: Caption = {
  text: "",
  // Fixed rather than seeded from the Design: a default that depended on when
  // the caption was typed relative to when colours were picked would make the
  // same sequence of edits produce different results.
  color: "#111827",
  size: "medium",
};

/** Collapse whitespace and cut to the cap. Runs of spaces are never meaningful here. */
export const clampCaptionText = (text: string): string =>
  text.replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION_LENGTH);

/**
 * The Caption the artefact actually gets, or `null` when there is nothing to
 * draw. A blank Caption is not an empty band: it is no band at all, and the
 * export stays byte-identical to what it was before captions existed.
 */
export const resolveCaption = (caption: Caption): Caption | null => {
  const text = clampCaptionText(caption.text);
  return text === "" ? null : { ...caption, text };
};

/** Width of a string, in the same units as the widths handed to `wrapCaption`. */
export type Measure = (text: string) => number;

const ellipsise = (line: string, maxWidth: number, measure: Measure): string => {
  let kept = line;
  while (kept !== "" && measure(kept + ELLIPSIS) > maxWidth) kept = kept.slice(0, -1);
  return kept.trimEnd() + ELLIPSIS;
};

/** Greedy word wrap, hard-breaking any single word too wide to stand alone. */
const wrapGreedily = (text: string, maxWidth: number, measure: Measure): string[] => {
  const lines: string[] = [];
  let current = "";

  for (const word of text.split(" ")) {
    if (word === "") continue;

    const candidate = current === "" ? word : `${current} ${word}`;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current !== "") lines.push(current);

    let rest = word;
    while (rest.length > 1 && measure(rest) > maxWidth) {
      let take = rest.length;
      while (take > 1 && measure(rest.slice(0, take)) > maxWidth) take--;
      lines.push(rest.slice(0, take));
      rest = rest.slice(take);
    }
    current = rest;
  }

  if (current !== "") lines.push(current);
  return lines;
};

/**
 * Break a Caption into at most `MAX_CAPTION_LINES` lines. Anything that does not
 * fit is ellipsised rather than allowed to widen the artefact: the export's
 * shape must not depend on how much the user typed.
 */
export const wrapCaption = (text: string, maxWidth: number, measure: Measure): string[] => {
  if (text === "" || maxWidth <= 0) return [];

  const all = wrapGreedily(text, maxWidth, measure);
  if (all.length <= MAX_CAPTION_LINES) return all;

  const kept = all.slice(0, MAX_CAPTION_LINES);
  kept[kept.length - 1] = ellipsise(kept[kept.length - 1], maxWidth, measure);
  return kept;
};

export type CaptionLayout = {
  lines: string[];
  fontSize: number;
  lineHeight: number;
  /** Distance from the bottom of the code to the top of the first line. */
  gap: number;
  /** The width the lines are wrapped and centred within. */
  maxWidth: number;
  /** Height of the whole artefact: the square code plus the caption block. */
  height: number;
};

/**
 * Lay a Caption out beneath a square code of `codeSize`.
 *
 * The code keeps its full quiet zone — that is a decode requirement, not
 * decoration — so the caption starts below it, and the same margin is repeated
 * underneath so the block is not flush with the artefact's bottom edge.
 */
export const captionLayout = (
  caption: Caption,
  codeSize: number,
  margin: number,
  measure: (text: string, fontSize: number) => number,
): CaptionLayout => {
  const fontSize = codeSize * CAPTION_SIZE_SCALE[caption.size];
  const lineHeight = fontSize * CAPTION_LINE_HEIGHT;
  const gap = codeSize * CAPTION_GAP_SCALE;

  const maxWidth = codeSize - margin * 2;
  const lines = wrapCaption(caption.text, maxWidth, (text) => measure(text, fontSize));

  return {
    lines,
    fontSize,
    lineHeight,
    gap,
    maxWidth,
    height: lines.length === 0 ? codeSize : codeSize + gap + lines.length * lineHeight + margin,
  };
};
