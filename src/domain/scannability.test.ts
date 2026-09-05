import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, type Design } from "./design.ts";
import { collectHints, contrastRatio, parseHexColor } from "./scannability.ts";

describe("parseHexColor", () => {
  it("parses six-digit hex", () => {
    expect(parseHexColor("#ff8000")).toEqual({ r: 255, g: 128, b: 0 });
  });

  it("expands three-digit hex", () => {
    expect(parseHexColor("#f80")).toEqual({ r: 255, g: 136, b: 0 });
  });

  it("tolerates a missing hash", () => {
    expect(parseHexColor("ffffff")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("rejects nonsense", () => {
    expect(parseHexColor("rebeccapurple")).toBe(null);
  });
});

describe("contrastRatio", () => {
  it("gives 21 for black on white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("gives 1 for a colour against itself", () => {
    expect(contrastRatio("#4488cc", "#4488cc")).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBe(contrastRatio("#ffffff", "#000000"));
  });
});

describe("collectHints", () => {
  it("is silent for a sane design", () => {
    expect(collectHints(DEFAULT_DESIGN, "https://example.com")).toEqual([]);
  });

  it("flags low contrast", () => {
    const design: Design = { ...DEFAULT_DESIGN, foreground: "#cccccc", background: "#ffffff" };
    expect(collectHints(design, "x").map((h) => h.code)).toEqual(["low-contrast"]);
  });

  it("flags a light-on-dark code even when contrast is high", () => {
    const design: Design = { ...DEFAULT_DESIGN, foreground: "#ffffff", background: "#000000" };
    expect(collectHints(design, "x").map((h) => h.code)).toEqual(["inverted"]);
  });

  it("assumes a transparent background composites onto white", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      foreground: "#ffffff",
      background: "#000000",
      transparentBackground: true,
    };
    expect(collectHints(design, "x").map((h) => h.code)).toEqual(["low-contrast"]);
  });

  it("says nothing about an oversized logo, which Enforcement caps rather than warns about", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      logo: { dataUri: "data:,", size: 0.9, hideBackgroundDots: true, margin: 0 },
    };
    expect(collectHints(design, "x")).toEqual([]);
  });

  it("judges contrast against a gradient's first colour, not the flat foreground", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      foreground: "#000000",
      gradient: { type: "linear", rotation: 0, from: "#eeeeee", to: "#ffffff" },
    };
    expect(collectHints(design, "x").map((h) => h.code)).toEqual(["low-contrast"]);
  });

  it("flags a very long payload", () => {
    expect(collectHints(DEFAULT_DESIGN, "a".repeat(900)).map((h) => h.code)).toEqual([
      "long-payload",
    ]);
  });
});
