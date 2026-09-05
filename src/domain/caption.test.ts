import { describe, expect, it } from "vitest";
import {
  CAPTION_SIZE_SCALE,
  DEFAULT_CAPTION,
  MAX_CAPTION_LENGTH,
  MAX_CAPTION_LINES,
  captionLayout,
  clampCaptionText,
  resolveCaption,
  wrapCaption,
} from "./caption.ts";

/** One unit per character: the arithmetic stays readable in the expectations. */
const monospace = (text: string) => text.length;

describe("clampCaptionText", () => {
  it("collapses whitespace and trims", () => {
    expect(clampCaptionText("  Scan   me\tplease ")).toBe("Scan me please");
  });

  it("cuts to the cap", () => {
    expect(clampCaptionText("a".repeat(80))).toHaveLength(MAX_CAPTION_LENGTH);
  });
});

describe("resolveCaption", () => {
  it("is null when there is nothing to draw", () => {
    expect(resolveCaption(DEFAULT_CAPTION)).toBeNull();
    expect(resolveCaption({ ...DEFAULT_CAPTION, text: "   " })).toBeNull();
  });

  it("carries the clamped text and the styling through", () => {
    expect(resolveCaption({ text: "  Scan  me ", color: "#ff0000", size: "large" })).toEqual({
      text: "Scan me",
      color: "#ff0000",
      size: "large",
    });
  });
});

describe("wrapCaption", () => {
  it("keeps a fitting caption on one line", () => {
    expect(wrapCaption("scan me", 20, monospace)).toEqual(["scan me"]);
  });

  it("wraps on word boundaries", () => {
    expect(wrapCaption("scan me for the menu", 12, monospace)).toEqual(["scan me for", "the menu"]);
  });

  it("ellipsises what will not fit in the line budget", () => {
    const lines = wrapCaption("one two three four five six seven", 9, monospace);
    expect(lines).toHaveLength(MAX_CAPTION_LINES);
    expect(lines[1].endsWith("…")).toBe(true);
    for (const line of lines) expect(monospace(line)).toBeLessThanOrEqual(9);
  });

  it("hard-breaks a single word too wide to stand alone", () => {
    const lines = wrapCaption("antidisestablishmentarianism", 10, monospace);
    expect(lines[0]).toBe("antidisest");
    expect(lines).toHaveLength(MAX_CAPTION_LINES);
    for (const line of lines) expect(monospace(line)).toBeLessThanOrEqual(10);
  });

  it("returns nothing for empty text or a useless width", () => {
    expect(wrapCaption("", 100, monospace)).toEqual([]);
    expect(wrapCaption("scan me", 0, monospace)).toEqual([]);
  });
});

describe("captionLayout", () => {
  const measure = (text: string, fontSize: number) => text.length * fontSize * 0.5;

  it("scales the font to the code and the size step", () => {
    const layout = captionLayout({ ...DEFAULT_CAPTION, text: "hi" }, 512, 8, measure);
    expect(layout.fontSize).toBeCloseTo(512 * CAPTION_SIZE_SCALE.medium);
  });

  it("makes the artefact taller than the code by the caption block", () => {
    const layout = captionLayout({ ...DEFAULT_CAPTION, text: "scan me" }, 512, 8, measure);
    expect(layout.height).toBeCloseTo(512 + layout.gap + layout.lineHeight + 8);
  });

  it("leaves the artefact square when there is nothing to draw", () => {
    expect(captionLayout({ ...DEFAULT_CAPTION, text: "" }, 512, 8, measure).height).toBe(512);
  });

  it("wraps within the code's width, inset by its quiet zone", () => {
    expect(captionLayout({ ...DEFAULT_CAPTION, text: "hi" }, 512, 8, measure).maxWidth).toBe(496);
  });
});
