import { describe, expect, it } from "vitest";
import { targetHasResolution, targetSupportsTransparency } from "./export.ts";

describe("target capabilities", () => {
  it("knows JPEG cannot carry transparency", () => {
    expect(targetSupportsTransparency("jpeg")).toBe(false);
    expect(targetSupportsTransparency("png")).toBe(true);
  });

  it("knows vector targets have no resolution to pick", () => {
    expect(targetHasResolution("svg")).toBe(false);
    expect(targetHasResolution("pdf")).toBe(false);
    expect(targetHasResolution("png")).toBe(true);
  });
});
