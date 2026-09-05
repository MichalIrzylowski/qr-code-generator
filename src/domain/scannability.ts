import type { Design } from "./design.ts";
import { effectiveForeground } from "./design.ts";

/**
 * Scannability Hints explain *why* a code is at risk. They are heuristic: the
 * authoritative answer is the Scannability Check, which decodes the rendered
 * image. Hints exist so a failure is actionable rather than mysterious.
 */
export type ScannabilityHint =
  | { code: "low-contrast"; ratio: number }
  | { code: "inverted"; ratio: number }
  | { code: "long-payload"; length: number };

/** Contrast below this is where decoders start to struggle in practice. */
export const MIN_CONTRAST_RATIO = 3;
const LONG_PAYLOAD = 800;

export const parseHexColor = (hex: string): { r: number; g: number; b: number } | null => {
  const match = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(hex.trim());
  if (!match) return null;

  const digits =
    match[1].length === 3
      ? match[1]
          .split("")
          .map((d) => d + d)
          .join("")
      : match[1];

  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  };
};

const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
  const channel = (value: number) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

/** WCAG contrast ratio, 1 to 21. Returns null if either colour is unparseable. */
export const contrastRatio = (a: string, b: string): number | null => {
  const first = parseHexColor(a);
  const second = parseHexColor(b);
  if (!first || !second) return null;

  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * A transparent background is composited over whatever the code is placed on.
 * We assume white, which is both the common case and the forgiving one.
 */
const effectiveBackground = (design: Design): string =>
  design.transparentBackground ? "#ffffff" : design.background;

export const collectHints = (design: Design, encoded: string): ScannabilityHint[] => {
  const hints: ScannabilityHint[] = [];

  const background = effectiveBackground(design);
  const foregroundColor = effectiveForeground(design);
  const ratio = contrastRatio(foregroundColor, background);
  if (ratio !== null) {
    if (ratio < MIN_CONTRAST_RATIO) {
      hints.push({ code: "low-contrast", ratio });
    } else {
      const foreground = parseHexColor(foregroundColor);
      const surface = parseHexColor(background);
      if (foreground && surface && relativeLuminance(foreground) > relativeLuminance(surface)) {
        hints.push({ code: "inverted", ratio });
      }
    }
  }

  if (encoded.length > LONG_PAYLOAD) {
    hints.push({ code: "long-payload", length: encoded.length });
  }

  return hints;
};

export const describeHint = (hint: ScannabilityHint): string => {
  switch (hint.code) {
    case "low-contrast":
      return `Contrast between the code and its background is only ${hint.ratio.toFixed(1)}:1. Aim for at least ${MIN_CONTRAST_RATIO}:1.`;
    case "inverted":
      return "The code is lighter than its background. Many scanners assume dark-on-light and will refuse to read this.";
    case "long-payload":
      return `${hint.length} characters makes for a dense code that needs a steady hand and a good camera.`;
  }
};
