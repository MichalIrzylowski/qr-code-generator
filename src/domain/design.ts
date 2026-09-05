import type { Caption } from "./caption.ts";
import type { Payload } from "./payload.ts";

export type DotStyle =
  | "square"
  | "dots"
  | "rounded"
  | "extra-rounded"
  | "classy"
  | "classy-rounded";
export type CornerSquareStyle = "square" | "dot" | "extra-rounded";
export type CornerDotStyle = "square" | "dot";
export type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

/** A Logo Overlay: always a local data URI, never a remote fetch (ADR-0001). */
export type LogoOverlay = {
  dataUri: string;
  /** Fraction of the code's width the logo occupies, before Enforcement caps it. */
  size: number;
  /** Clear the dots sitting behind the logo, rather than drawing over them. */
  hideBackgroundDots: boolean;
  margin: number;
};

/**
 * An optional two-stop gradient across the code's dots. `null` means a flat
 * fill, which is what most codes want and what every scanner is happiest with.
 */
export type Gradient = {
  type: "linear" | "radial";
  /** Rotation in degrees; ignored for a radial gradient. */
  rotation: number;
  from: string;
  to: string;
};

export type CornerStyling =
  | { linked: true }
  | {
      linked: false;
      squareStyle: CornerSquareStyle;
      squareColor: string;
      dotStyle: CornerDotStyle;
      dotColor: string;
    };

export type Design = {
  dotStyle: DotStyle;
  foreground: string;
  /** When set, the dots use this instead of the flat `foreground` colour. */
  gradient: Gradient | null;
  background: string;
  transparentBackground: boolean;
  margin: number;
  corners: CornerStyling;
  logo: LogoOverlay | null;
  /** null means "let Enforcement pick"; a level means the user chose it. */
  errorCorrection: ErrorCorrectionLevel | null;
};

/** The largest share of the code a Logo Overlay may cover and still decode. */
export const MAX_LOGO_SIZE = 0.3;

export const DEFAULT_DESIGN: Design = {
  dotStyle: "rounded",
  foreground: "#111827",
  gradient: null,
  background: "#ffffff",
  transparentBackground: false,
  margin: 8,
  corners: { linked: true },
  logo: null,
  errorCorrection: null,
};

/**
 * Enforcement: resolve the error correction level actually used.
 *
 * A Logo Overlay destroys modules, so its presence forces level H and a manual
 * override cannot weaken that. Without a logo the user's choice stands, and the
 * default is M.
 */
export const resolveErrorCorrection = (design: Design): ErrorCorrectionLevel => {
  if (design.logo !== null) return "H";
  return design.errorCorrection ?? "M";
};

/** Enforcement: clamp a Logo Overlay to a size the code can survive. */
export const resolveLogoSize = (size: number): number =>
  Math.min(Math.max(size, 0.05), MAX_LOGO_SIZE);

/**
 * The colour a scanner effectively sees for the dots. A gradient has no single
 * colour, so its darker-looking end stands in for contrast checks.
 */
export const effectiveForeground = (design: Design): string =>
  design.gradient ? design.gradient.from : design.foreground;

/** The colours the corners actually render in, after resolving `linked`. */
export const resolveCorners = (
  design: Design,
): {
  squareStyle: CornerSquareStyle;
  squareColor: string;
  dotStyle: CornerDotStyle;
  dotColor: string;
} => {
  if (!design.corners.linked) {
    const { squareStyle, squareColor, dotStyle, dotColor } = design.corners;
    return { squareStyle, squareColor, dotStyle, dotColor };
  }

  const squareStyle: CornerSquareStyle =
    design.dotStyle === "dots" || design.dotStyle === "classy"
      ? "dot"
      : design.dotStyle === "square"
        ? "square"
        : "extra-rounded";

  return {
    squareStyle,
    squareColor: effectiveForeground(design),
    dotStyle: design.dotStyle === "dots" ? "dot" : "square",
    dotColor: effectiveForeground(design),
  };
};

/**
 * Everything that makes up one artefact. A Caption sits beside the Design
 * rather than inside it: a Design is the set of *visual* choices applied to a
 * Payload, and a Caption is neither encoded nor purely visual — it is text
 * meant for a human, which is why it gets its own place here.
 */
export type QrDesign = { payload: Payload; design: Design; caption: Caption };
