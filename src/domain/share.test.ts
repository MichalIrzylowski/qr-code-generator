import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, type Design } from "./design.ts";
import { decodeShare, encodeShare, shareOmitsLogo } from "./share.ts";

const payload = { kind: "url", value: "example.com" } as const;

describe("share codec", () => {
  it("round-trips a design", () => {
    const design: Design = { ...DEFAULT_DESIGN, dotStyle: "classy", foreground: "#ff0000" };
    expect(decodeShare(encodeShare({ payload, design }))).toEqual({ payload, design });
  });

  it("survives non-ascii payloads", () => {
    const original = { payload: { kind: "text", value: "héllo 🌍" } as const, design: DEFAULT_DESIGN };
    expect(decodeShare(encodeShare(original))).toEqual(original);
  });

  it("drops the logo when encoding", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      logo: { dataUri: "data:image/png;base64,AAAA", size: 0.2, hideBackgroundDots: true, margin: 4 },
    };
    const encoded = encodeShare({ payload, design });
    expect(encoded).not.toContain("AAAA");
    expect(decodeShare(encoded)?.design.logo).toBe(null);
  });

  it("produces url-safe output", () => {
    const encoded = encodeShare({ payload: { kind: "text", value: "??>>//++" }, design: DEFAULT_DESIGN });
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("knows when sharing will lose the logo", () => {
    expect(shareOmitsLogo(DEFAULT_DESIGN)).toBe(false);
    expect(
      shareOmitsLogo({
        ...DEFAULT_DESIGN,
        logo: { dataUri: "data:,", size: 0.2, hideBackgroundDots: true, margin: 0 },
      }),
    ).toBe(true);
  });

  it("fills in missing fields from the defaults", () => {
    const partial = btoa(JSON.stringify({ p: payload, d: { dotStyle: "dots" } }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const decoded = decodeShare(partial);
    expect(decoded?.design.dotStyle).toBe("dots");
    expect(decoded?.design.margin).toBe(DEFAULT_DESIGN.margin);
  });

  it("returns null for junk rather than throwing", () => {
    expect(decodeShare("not-base64-!!!")).toBe(null);
    expect(decodeShare(btoa("[]"))).toBe(null);
    expect(decodeShare(btoa(JSON.stringify({ p: { kind: "wifi", value: "x" } })))).toBe(null);
  });
});

describe("decodeShare against untrusted input", () => {
  const craft = (design: Record<string, unknown>) =>
    btoa(JSON.stringify({ p: payload, d: design }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

  it("rejects a dot style that is not one of ours", () => {
    expect(decodeShare(craft({ dotStyle: "'; drop table --" }))?.design.dotStyle).toBe(
      DEFAULT_DESIGN.dotStyle,
    );
  });

  it("rejects a colour that is not a hex value", () => {
    expect(decodeShare(craft({ foreground: "url(javascript:alert(1))" }))?.design.foreground).toBe(
      DEFAULT_DESIGN.foreground,
    );
  });

  it("rejects a non-string colour", () => {
    expect(decodeShare(craft({ background: { toString: 1 } }))?.design.background).toBe(
      DEFAULT_DESIGN.background,
    );
  });

  it("clamps an absurd margin", () => {
    expect(decodeShare(craft({ margin: 99999 }))?.design.margin).toBe(40);
    expect(decodeShare(craft({ margin: -5 }))?.design.margin).toBe(0);
  });

  it("ignores a non-numeric margin", () => {
    expect(decodeShare(craft({ margin: "8" }))?.design.margin).toBe(DEFAULT_DESIGN.margin);
  });

  it("ignores an unknown error correction level", () => {
    expect(decodeShare(craft({ errorCorrection: "Z" }))?.design.errorCorrection).toBe(null);
  });

  it("drops fields it does not know about", () => {
    const decoded = decodeShare(craft({ evil: "payload", __proto__: { polluted: true } }));
    expect(decoded).not.toBeNull();
    expect("evil" in decoded!.design).toBe(false);
  });

  it("repairs a half-specified unlinked corner block", () => {
    const decoded = decodeShare(craft({ foreground: "#123456", corners: { linked: false } }));
    expect(decoded?.design.corners).toEqual({
      linked: false,
      squareStyle: "extra-rounded",
      squareColor: "#123456",
      dotStyle: "square",
      dotColor: "#123456",
    });
  });

  it("treats a non-object corners value as linked", () => {
    expect(decodeShare(craft({ corners: "linked" }))?.design.corners).toEqual({ linked: true });
  });
});
