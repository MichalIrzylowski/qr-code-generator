import { describe, expect, it } from "vitest";
import { EMPTY_CARD, createField, type ContactCard } from "./contact.ts";
import { emptyPayload, encodePayload, inspectPayload } from "./payload.ts";

const card = (over: Partial<ContactCard> = {}): ContactCard => ({ ...EMPTY_CARD, ...over });

describe("encodePayload", () => {
  it("prepends https:// to a bare host", () => {
    expect(encodePayload({ kind: "url", value: "example.com" })).toBe("https://example.com");
  });

  it("leaves an existing scheme alone", () => {
    expect(encodePayload({ kind: "url", value: "http://example.com" })).toBe("http://example.com");
    expect(encodePayload({ kind: "url", value: "mailto:a@b.com" })).toBe("mailto:a@b.com");
  });

  it("trims surrounding whitespace", () => {
    expect(encodePayload({ kind: "url", value: "  example.com  " })).toBe("https://example.com");
  });

  it("returns empty for a blank url rather than https://", () => {
    expect(encodePayload({ kind: "url", value: "   " })).toBe("");
  });

  it("passes text through untouched", () => {
    expect(encodePayload({ kind: "text", value: "  hi there " })).toBe("  hi there ");
  });
});

describe("inspectPayload", () => {
  it("flags an empty payload", () => {
    expect(inspectPayload({ kind: "url", value: "" })).toBe("empty");
  });

  it("accepts a plausible url", () => {
    expect(inspectPayload({ kind: "url", value: "example.com/a?b=c" })).toBe(null);
  });

  it("flags a hostname with no dot", () => {
    expect(inspectPayload({ kind: "url", value: "localhost" })).toBe("malformed-url");
  });

  it("flags something that cannot parse as a url", () => {
    expect(inspectPayload({ kind: "url", value: "http://" })).toBe("malformed-url");
  });

  it("never flags non-empty text as malformed", () => {
    expect(inspectPayload({ kind: "text", value: "not a url" })).toBe(null);
  });
});

describe("contact payloads", () => {
  it("encodes a card as a vCard envelope", () => {
    const encoded = encodePayload({ kind: "contact", card: card({ firstName: "Jane" }) });
    expect(encoded.startsWith("BEGIN:VCARD")).toBe(true);
  });

  it("encodes an empty card as nothing, so no code is drawn", () => {
    expect(encodePayload({ kind: "contact", card: EMPTY_CARD })).toBe("");
  });

  it("flags an empty card", () => {
    expect(inspectPayload({ kind: "contact", card: EMPTY_CARD })).toBe("empty");
  });

  it("flags a card with details but no name", () => {
    const fields = [{ ...createField("phone", 1), value: "07700 900123" }];
    expect(inspectPayload({ kind: "contact", card: card({ fields }) })).toBe("contact-no-name");
  });

  it("accepts a named card", () => {
    expect(inspectPayload({ kind: "contact", card: card({ lastName: "Doe" }) })).toBe(null);
  });
});

describe("emptyPayload", () => {
  it("gives a blank value for the string kinds", () => {
    expect(emptyPayload("url")).toEqual({ kind: "url", value: "" });
  });

  it("gives a blank card for a contact", () => {
    expect(emptyPayload("contact")).toEqual({ kind: "contact", card: EMPTY_CARD });
  });
});
