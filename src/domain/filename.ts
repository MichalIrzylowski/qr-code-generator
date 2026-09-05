import type { Payload } from "./payload.ts";
import { encodePayload } from "./payload.ts";

/** A stable, filesystem-safe basename derived from what the code encodes. */
export const exportBasename = (payload: Payload): string => {
  const encoded = encodePayload(payload);
  if (encoded === "") return "qr-code";

  let candidate = encoded;
  try {
    const url = new URL(encoded);
    candidate = url.hostname.replace(/^www\./, "") + url.pathname;
  } catch {
    // Not a URL; slugify the raw text instead.
  }

  const slug = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/, "");

  return slug === "" ? "qr-code" : `qr-${slug}`;
};
