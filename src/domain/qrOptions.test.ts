import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, type Design } from "./design.ts";
import { asQrBytes, toQrOptions } from "./qrOptions.ts";

describe("toQrOptions", () => {
  it("carries the encoded payload and size through", () => {
    const options = toQrOptions(DEFAULT_DESIGN, "https://example.com", 512);
    expect(options.data).toBe("https://example.com");
    expect(options.width).toBe(512);
    expect(options.height).toBe(512);
  });

  it("renders a transparent background as transparent, not as the stored colour", () => {
    const design: Design = { ...DEFAULT_DESIGN, background: "#ff0000", transparentBackground: true };
    expect(toQrOptions(design, "x", 512).backgroundOptions?.color).toBe("transparent");
  });

  it("applies Enforcement to the error correction level", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      errorCorrection: "L",
      logo: { dataUri: "data:,", size: 0.2, hideBackgroundDots: true, margin: 4 },
    };
    expect(toQrOptions(design, "x", 512).qrOptions?.errorCorrectionLevel).toBe("H");
  });

  it("applies Enforcement to the logo size", () => {
    const design: Design = {
      ...DEFAULT_DESIGN,
      logo: { dataUri: "data:,", size: 0.9, hideBackgroundDots: true, margin: 4 },
    };
    expect(toQrOptions(design, "x", 512).imageOptions?.imageSize).toBe(0.3);
  });

  it("carries no image when there is no logo", () => {
    expect(toQrOptions(DEFAULT_DESIGN, "x", 512).image).toBeUndefined();
  });

  it("always supplies an imageOptions object, which the library requires", () => {
    // `qr-code-styling` merges imageOptions without a default and throws on
    // an explicit undefined, so this must be an object even with no logo.
    expect(toQrOptions(DEFAULT_DESIGN, "x", 512).imageOptions).toEqual({
      imageSize: 0,
      margin: 0,
      hideBackgroundDots: true,
    });
  });
});

/**
 * The library truncates each character to one byte, and every decoder reads
 * those bytes back as UTF-8. Anything above U+00FF is silently mangled unless
 * we hand the library the UTF-8 bytes ourselves.
 */
describe("asQrBytes", () => {
  const roundTrip = (text: string) =>
    new TextDecoder().decode(
      Uint8Array.from([...asQrBytes(text)], (character) => character.charCodeAt(0) & 0xff),
    );

  it("leaves ascii untouched, so plain payloads encode as compactly as before", () => {
    expect(asQrBytes("https://example.com")).toBe("https://example.com");
  });

  it("survives the truncation the library applies", () => {
    // The standard Polish pangram: every diacritic the language has, in one line.
    expect(roundTrip("Zażółć gęślą jaźń")).toBe("Zażółć gęślą jaźń");
  });

  it("keeps the letters that used to collide with ascii", () => {
    // ł is U+0142: truncated to one byte it becomes 0x42, the letter B.
    expect(roundTrip("ł ą ę ż ó ś ć ń ź")).toBe("ł ą ę ż ó ś ć ń ź");
    expect(asQrBytes("ł")).not.toBe("B");
  });

  it("carries characters outside the basic plane", () => {
    expect(roundTrip("héllo 🌍")).toBe("héllo 🌍");
  });

  it("copes with a payload long enough to overflow an argument list", () => {
    const long = "ł".repeat(50000);
    expect(roundTrip(long)).toBe(long);
  });
});

describe("toQrOptions with non-ascii", () => {
  it("hands the library bytes rather than code points", () => {
    const options = toQrOptions(DEFAULT_DESIGN, "Zażółć", 512);
    expect(options.data).toBe(asQrBytes("Zażółć"));
    expect(options.data).not.toBe("Zażółć");
  });
});
