import { describe, expect, it } from "vitest";
import { encodePayload, inspectPayload } from "./payload.ts";

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
