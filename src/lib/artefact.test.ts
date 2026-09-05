import { readFileSync } from "node:fs";
import { parse, type Font } from "opentype.js";
import { describe, expect, it } from "vitest";
import { DEFAULT_CAPTION } from "@/domain/caption.ts";
import { DEFAULT_DESIGN } from "@/domain/design.ts";
import { composeArtefact, scaleToWidth } from "./artefact.ts";

// Node pools small reads into a shared ArrayBuffer, so hand opentype an
// ArrayBuffer holding this file and nothing else.
const bytes = readFileSync("public/fonts/inter-caption.ttf");
const font: Font = parse(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));

const CODE = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"/>';

describe("composeArtefact", () => {
  it("leaves a code without a caption exactly as it was", () => {
    expect(composeArtefact(CODE, 512, DEFAULT_DESIGN, null, font)).toEqual({
      svg: CODE,
      width: 512,
      height: 512,
    });
  });

  it("makes the artefact taller but never wider", () => {
    const artefact = composeArtefact(
      CODE,
      512,
      DEFAULT_DESIGN,
      { ...DEFAULT_CAPTION, text: "Scan for the menu" },
      font,
    );

    expect(artefact.width).toBe(512);
    expect(artefact.height).toBeGreaterThan(512);
    expect(artefact.svg).toContain(`viewBox="0 0 512 ${artefact.height}"`);
    expect(artefact.svg).toContain(CODE);
  });

  it("emits Polish diacritics as path data, not text", () => {
    const artefact = composeArtefact(
      CODE,
      512,
      DEFAULT_DESIGN,
      { ...DEFAULT_CAPTION, text: "Zażółć gęślą jaźń" },
      font,
    );

    expect(artefact.svg).not.toContain("<text");
    expect(artefact.svg).not.toContain("Zażółć");
    expect(artefact.svg).toMatch(/<path d="M[\d.-]/);
  });

  it("paints the caption band with the code's background, and nothing when transparent", () => {
    const caption = { ...DEFAULT_CAPTION, text: "hi" };
    expect(
      composeArtefact(CODE, 512, { ...DEFAULT_DESIGN, background: "#ff0000" }, caption, font).svg,
    ).toContain('fill="#ff0000"');
    expect(
      composeArtefact(CODE, 512, { ...DEFAULT_DESIGN, transparentBackground: true }, caption, font)
        .svg,
    ).not.toContain("<rect");
  });

  it("refuses a colour that is not a colour", () => {
    const artefact = composeArtefact(
      CODE,
      512,
      DEFAULT_DESIGN,
      { ...DEFAULT_CAPTION, text: "hi", color: '"/><script>alert(1)</script>' },
      font,
    );

    expect(artefact.svg).not.toContain("<script");
    expect(artefact.svg).toContain(`fill="${DEFAULT_CAPTION.color}"`);
  });
});

describe("scaleToWidth", () => {
  it("treats the requested width as the code's, so the code never shrinks", () => {
    expect(scaleToWidth({ width: 512, height: 512 }, 1024)).toEqual({ width: 1024, height: 1024 });
    expect(scaleToWidth({ width: 512, height: 640 }, 1024)).toEqual({ width: 1024, height: 1280 });
  });
});
