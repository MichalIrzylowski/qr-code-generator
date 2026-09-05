import { describe, expect, it } from "vitest";
import { DEFAULT_DESIGN, type Design } from "./design.ts";
import { toQrOptions } from "./qrOptions.ts";

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
