import { CAPTION_SIZES, DEFAULT_CAPTION, clampCaptionText, resolveCaption } from "./caption.ts";
import type { Caption, CaptionSize } from "./caption.ts";
import { EMPTY_CARD, isCardEmpty } from "./contact.ts";
import { DEFAULT_DESIGN } from "./design.ts";
import type { Payload } from "./payload.ts";
import type {
  CornerDotStyle,
  CornerSquareStyle,
  CornerStyling,
  Design,
  DotStyle,
  ErrorCorrectionLevel,
  Gradient,
  QrDesign,
} from "./design.ts";

/**
 * A Design encoded into a URL, so a design can be handed to someone without a
 * server existing to hold it. The Logo Overlay is deliberately dropped: its data
 * URI would blow past practical URL length limits (ADR-0001).
 */
export const SHARE_PARAM = "c";

const toBase64Url = (json: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (encoded: string): string => {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
};

/** True when sharing this design will silently lose something. */
export const shareOmitsLogo = (design: Design): boolean => design.logo !== null;

/**
 * True when a link will carry the Design but not what the code encodes. Only a
 * Contact card is withheld, and only when there is something to withhold: a
 * person's phone number and address must not ride along in a URL that lands in
 * browser history and chat logs (ADR-0004).
 */
export const shareOmitsPayload = (payload: Payload): boolean =>
  payload.kind === "contact" && !isCardEmpty(payload.card);

/** What of the Payload is safe to put in a link. */
const shareablePayload = (payload: Payload): Payload =>
  payload.kind === "contact" ? { kind: "contact", card: EMPTY_CARD } : payload;

export const encodeShare = ({ payload, design, caption }: QrDesign): string =>
  toBase64Url(
    JSON.stringify({
      p: shareablePayload(payload),
      d: { ...design, logo: null },
      c: resolveCaption(caption),
    }),
  );

const DOT_STYLES = new Set<DotStyle>([
  "square",
  "dots",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
]);
const CORNER_SQUARE_STYLES = new Set<CornerSquareStyle>(["square", "dot", "extra-rounded"]);
const CORNER_DOT_STYLES = new Set<CornerDotStyle>(["square", "dot"]);
const EC_LEVELS = new Set<ErrorCorrectionLevel>(["L", "M", "Q", "H"]);
const HEX = /^#[0-9a-f]{6}$/i;
const CAPTION_SIZE_SET = new Set<CaptionSize>(CAPTION_SIZES);

const asMember = <T extends string>(value: unknown, allowed: Set<T>, fallback: T): T =>
  typeof value === "string" && allowed.has(value as T) ? (value as T) : fallback;

const asHex = (value: unknown, fallback: string): string =>
  typeof value === "string" && HEX.test(value) ? value : fallback;

const asBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const asNumber = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(Math.max(value, min), max)
    : fallback;

/**
 * Unlike a Logo Overlay, a Caption is small enough to ride in a link — capped at
 * a handful of characters, it costs a few bytes of base64.
 */
const decodeCaption = (raw: unknown): Caption => {
  if (typeof raw !== "object" || raw === null) return DEFAULT_CAPTION;

  const caption = raw as Record<string, unknown>;
  return {
    text: typeof caption.text === "string" ? clampCaptionText(caption.text) : "",
    color: asHex(caption.color, DEFAULT_CAPTION.color),
    size: asMember(caption.size, CAPTION_SIZE_SET, DEFAULT_CAPTION.size),
  };
};

const GRADIENT_TYPES = new Set<Gradient["type"]>(["linear", "radial"]);

const decodeGradient = (raw: unknown): Gradient | null => {
  if (typeof raw !== "object" || raw === null) return null;

  const gradient = raw as Record<string, unknown>;
  const from = asHex(gradient.from, "");
  const to = asHex(gradient.to, "");
  if (from === "" || to === "") return null;

  return {
    type: asMember(gradient.type, GRADIENT_TYPES, "linear"),
    rotation: asNumber(gradient.rotation, 0, 0, 360),
    from,
    to,
  };
};

const decodeCorners = (raw: unknown, foreground: string): CornerStyling => {
  if (typeof raw !== "object" || raw === null) return { linked: true };

  const corners = raw as Record<string, unknown>;
  if (corners.linked !== false) return { linked: true };

  return {
    linked: false,
    squareStyle: asMember(corners.squareStyle, CORNER_SQUARE_STYLES, "extra-rounded"),
    squareColor: asHex(corners.squareColor, foreground),
    dotStyle: asMember(corners.dotStyle, CORNER_DOT_STYLES, "square"),
    dotColor: asHex(corners.dotColor, foreground),
  };
};

/**
 * Decode a share string back into a QrDesign.
 *
 * A share link is untrusted input from someone else's URL bar, so every field is
 * checked against what it is allowed to be and anything unrecognised falls back
 * to the default. Unknown fields are dropped rather than merged, which also
 * means a link made by an older version of the app still opens.
 */
export const decodeShare = (encoded: string): QrDesign | null => {
  try {
    const raw: unknown = JSON.parse(fromBase64Url(encoded));
    if (typeof raw !== "object" || raw === null) return null;

    const { p, d, c } = raw as { p?: unknown; d?: unknown; c?: unknown };
    if (typeof p !== "object" || p === null) return null;

    // A Contact card is never encoded into a link, so it is never read out of
    // one either: a contact link restores the Design onto an empty card, and a
    // hand-crafted link cannot smuggle fields past this.
    const { kind, value } = p as { kind?: unknown; value?: unknown };
    const payload: Payload | null =
      kind === "contact"
        ? { kind: "contact", card: EMPTY_CARD }
        : (kind === "url" || kind === "text") && typeof value === "string"
          ? { kind, value }
          : null;
    if (payload === null) return null;

    const source = (typeof d === "object" && d !== null ? d : {}) as Record<string, unknown>;
    const foreground = asHex(source.foreground, DEFAULT_DESIGN.foreground);
    const rawEc = source.errorCorrection;

    const design: Design = {
      dotStyle: asMember(source.dotStyle, DOT_STYLES, DEFAULT_DESIGN.dotStyle),
      foreground,
      gradient: decodeGradient(source.gradient),
      background: asHex(source.background, DEFAULT_DESIGN.background),
      transparentBackground: asBoolean(
        source.transparentBackground,
        DEFAULT_DESIGN.transparentBackground,
      ),
      margin: asNumber(source.margin, DEFAULT_DESIGN.margin, 0, 40),
      corners: decodeCorners(source.corners, foreground),
      // A Logo Overlay is never carried by a share link (ADR-0001).
      logo: null,
      errorCorrection:
        typeof rawEc === "string" && EC_LEVELS.has(rawEc as ErrorCorrectionLevel)
          ? (rawEc as ErrorCorrectionLevel)
          : null,
    };

    return { payload, design, caption: decodeCaption(c) };
  } catch {
    return null;
  }
};
