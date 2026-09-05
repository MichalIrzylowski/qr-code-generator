import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESIGN,
  MAX_LOGO_SIZE,
  resolveCorners,
  resolveErrorCorrection,
  resolveLogoSize,
  type Design,
  type LogoOverlay,
} from "./design.ts";

const logo: LogoOverlay = { dataUri: "data:image/png;base64,x", size: 0.2, hideBackgroundDots: true, margin: 4 };

describe("resolveErrorCorrection", () => {
  it("defaults to M with no logo and no choice", () => {
    expect(resolveErrorCorrection(DEFAULT_DESIGN)).toBe("M");
  });

  it("honours an explicit choice with no logo", () => {
    expect(resolveErrorCorrection({ ...DEFAULT_DESIGN, errorCorrection: "L" })).toBe("L");
  });

  it("forces H when a logo is present", () => {
    expect(resolveErrorCorrection({ ...DEFAULT_DESIGN, logo })).toBe("H");
  });

  it("does not let a manual override weaken H while a logo is present", () => {
    const design: Design = { ...DEFAULT_DESIGN, logo, errorCorrection: "L" };
    expect(resolveErrorCorrection(design)).toBe("H");
  });
});

describe("resolveLogoSize", () => {
  it("caps an oversized logo", () => {
    expect(resolveLogoSize(0.9)).toBe(MAX_LOGO_SIZE);
  });

  it("raises a vanishingly small logo to a visible floor", () => {
    expect(resolveLogoSize(0)).toBe(0.05);
  });

  it("leaves a reasonable size alone", () => {
    expect(resolveLogoSize(0.2)).toBe(0.2);
  });
});

describe("resolveCorners", () => {
  it("follows the dot style and foreground when linked", () => {
    const design: Design = { ...DEFAULT_DESIGN, dotStyle: "dots", foreground: "#ff0000" };
    expect(resolveCorners(design)).toEqual({
      squareStyle: "dot",
      squareColor: "#ff0000",
      dotStyle: "dot",
      dotColor: "#ff0000",
    });
  });

  it("keeps square corners square when the dots are square", () => {
    expect(resolveCorners({ ...DEFAULT_DESIGN, dotStyle: "square" }).squareStyle).toBe("square");
  });

  it("uses the independent values when unlinked", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      foreground: "#000000",
      corners: {
        linked: false,
        squareStyle: "square",
        squareColor: "#00ff00",
        dotStyle: "dot",
        dotColor: "#0000ff",
      },
    };
    expect(resolveCorners(design)).toEqual({
      squareStyle: "square",
      squareColor: "#00ff00",
      dotStyle: "dot",
      dotColor: "#0000ff",
    });
  });
});
