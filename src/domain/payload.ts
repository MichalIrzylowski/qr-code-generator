/**
 * A Payload is the data a QR code encodes, as a tagged variant. Only `url` is
 * built today; the union is the seam that lets `wifi`, `vcard` and friends land
 * later without reshaping the Design around them.
 */
export type Payload = { kind: "url"; value: string } | { kind: "text"; value: string };

export type PayloadIssue = "empty" | "malformed-url";

const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/**
 * Normalise a Payload into the string that actually gets encoded.
 *
 * A URL without a scheme gets `https://` prepended, because that is what the
 * user meant and what every scanner will assume. Nothing here blocks encoding:
 * a QR code of a typo is still a valid QR code.
 */
export const encodePayload = (payload: Payload): string => {
  if (payload.kind === "text") return payload.value;

  const trimmed = payload.value.trim();
  if (trimmed === "") return "";
  if (SCHEME.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/**
 * Report what is wrong with a Payload, if anything. Advisory only — the caller
 * surfaces this as a hint, never as a gate on generating the code.
 */
export const inspectPayload = (payload: Payload): PayloadIssue | null => {
  const trimmed = payload.value.trim();
  if (trimmed === "") return "empty";
  if (payload.kind === "text") return null;

  try {
    const url = new URL(encodePayload(payload));
    if (url.hostname === "" || !url.hostname.includes(".")) return "malformed-url";
    return null;
  } catch {
    return "malformed-url";
  }
};
