import type { Payload } from "./payload.ts";
import { encodePayload } from "./payload.ts";
import { cardDisplayName } from "./contact.ts";

const slugify = (candidate: string): string =>
  candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");

/**
 * A stable, filesystem-safe basename derived from what the code *means* rather
 * than what it encodes. A Contact card's encoded form is a vCard envelope, which
 * would slugify into `qr-begin-vcard-version-3-0-fn-…` — so each variant names
 * its own Export.
 */
export const exportBasename = (payload: Payload): string => {
  if (payload.kind === "contact") {
    const slug = slugify(cardDisplayName(payload.card));
    return slug === "" ? "qr-contact" : `qr-${slug}`;
  }

  const encoded = encodePayload(payload);
  if (encoded === "") return "qr-code";

  let candidate = encoded;
  try {
    const url = new URL(encoded);
    candidate = url.hostname.replace(/^www\./, "") + url.pathname;
  } catch {
    // Not a URL; slugify the raw text instead.
  }

  const slug = slugify(candidate);
  return slug === "" ? "qr-code" : `qr-${slug}`;
};
