import { EMPTY_CARD, cardDisplayName, encodeVCard, isCardEmpty } from "./contact.ts";
import type { ContactCard } from "./contact.ts";

/**
 * A Payload is the data a QR code encodes, as a tagged variant. The variant is
 * the user's first and most visible choice, and it owns its own answers to what
 * "empty" means, what an Export of it is called (`filename.ts`) and whether it
 * may ride in a share link (`share.ts`) — those genuinely differ per variant
 * rather than being one rule with exceptions.
 */
export type Payload =
  | { kind: "url"; value: string }
  | { kind: "text"; value: string }
  | { kind: "contact"; card: ContactCard };

export type PayloadKind = Payload["kind"];

/** Tab order. Link first: it is what most people came for. */
export const PAYLOAD_KINDS: PayloadKind[] = ["url", "text", "contact"];

export type PayloadIssue = "empty" | "malformed-url" | "contact-no-name";

const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/** A blank Payload of a kind, used when switching tabs. */
export const emptyPayload = (kind: PayloadKind): Payload =>
  kind === "contact" ? { kind, card: EMPTY_CARD } : { kind, value: "" };

/**
 * Normalise a Payload into the string that actually gets encoded.
 *
 * A URL without a scheme gets `https://` prepended, because that is what the
 * user meant and what every scanner will assume. Nothing here blocks encoding:
 * a QR code of a typo is still a valid QR code.
 */
export const encodePayload = (payload: Payload): string => {
  if (payload.kind === "contact") return encodeVCard(payload.card);
  if (payload.kind === "text") return payload.value;

  const trimmed = payload.value.trim();
  if (trimmed === "") return "";
  if (SCHEME.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/**
 * Report what is wrong with a Payload, if anything. Advisory only — the caller
 * surfaces this as a hint, never as a gate on generating the code. A Contact
 * card with no Name still encodes, even though most phones will refuse to save
 * it; saying so is the app's job, refusing is not.
 */
export const inspectPayload = (payload: Payload): PayloadIssue | null => {
  if (payload.kind === "contact") {
    if (isCardEmpty(payload.card)) return "empty";
    return cardDisplayName(payload.card) === "" ? "contact-no-name" : null;
  }

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
