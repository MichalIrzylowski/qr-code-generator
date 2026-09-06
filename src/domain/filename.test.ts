import { describe, expect, it } from "vitest";
import { EMPTY_CARD } from "./contact.ts";
import { exportBasename } from "./filename.ts";

describe("exportBasename", () => {
  it("uses the host and path of a url", () => {
    expect(exportBasename({ kind: "url", value: "https://www.example.com/menu" })).toBe(
      "qr-example-com-menu",
    );
  });

  it("slugifies plain text", () => {
    expect(exportBasename({ kind: "text", value: "Hello, World!" })).toBe("qr-hello-world");
  });

  it("falls back for an empty payload", () => {
    expect(exportBasename({ kind: "url", value: "" })).toBe("qr-code");
  });

  it("falls back when nothing survives slugification", () => {
    expect(exportBasename({ kind: "text", value: "!!!" })).toBe("qr-code");
  });

  it("truncates without leaving a trailing dash", () => {
    const name = exportBasename({ kind: "text", value: "a".repeat(20) + " " + "b".repeat(60) });
    expect(name.length).toBeLessThanOrEqual(51);
    expect(name.endsWith("-")).toBe(false);
  });
});

describe("exportBasename for a contact card", () => {
  it("uses the name", () => {
    const card = { ...EMPTY_CARD, firstName: "Jane", lastName: "Doe" };
    expect(exportBasename({ kind: "contact", card })).toBe("qr-jane-doe");
  });

  it("falls back when the card has no name", () => {
    expect(exportBasename({ kind: "contact", card: EMPTY_CARD })).toBe("qr-contact");
  });

  it("never leaks the vcard envelope into the filename", () => {
    const card = { ...EMPTY_CARD, firstName: "Jane" };
    expect(exportBasename({ kind: "contact", card })).not.toContain("vcard");
  });
});
