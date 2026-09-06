import type { Options } from "qr-code-styling";
import {
  resolveCorners,
  resolveErrorCorrection,
  resolveLogoSize,
  type Design,
  type Gradient,
} from "./design.ts";

const toGradient = (gradient: Gradient) => ({
  type: gradient.type,
  rotation: (gradient.rotation * Math.PI) / 180,
  colorStops: [
    { offset: 0, color: gradient.from },
    { offset: 1, color: gradient.to },
  ],
});

/**
 * Re-encode a payload as the bytes it should occupy in the code.
 *
 * `qr-code-styling` bundles its own `qrcode-generator`, whose byte-mode encoder
 * is hard-wired to `charCodeAt(i) & 0xff` — one byte per code point, with the
 * high bits thrown away. Every decoder, `jsQR` included, reads those bytes back
 * as UTF-8. So anything above U+00FF was silently corrupted: `ł` (U+0142) was
 * truncated to 0x42 and arrived as `B`, and `ą` and `ę` became invisible
 * control bytes. There is no option to change the encoder and no shared module
 * instance to patch, so the conversion happens here, at the boundary.
 *
 * The result is a string of code points below 0x100 whose truncation *is* the
 * UTF-8 encoding of the original. Pure ASCII passes through unchanged, so
 * ordinary links still take the compact Alphanumeric and Numeric modes that the
 * library picks by inspecting this same string.
 */
export const asQrBytes = (text: string): string => {
  const bytes = new TextEncoder().encode(text);

  // Built one chunk at a time: spreading a whole payload into `fromCharCode`
  // overflows the argument list somewhere in the tens of thousands of bytes.
  let out = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    out += String.fromCharCode(...bytes.subarray(i, i + 8192));
  }
  return out;
};

/**
 * Translate a Design into `qr-code-styling` options. Enforcement is applied here
 * so there is no path to the renderer that bypasses it.
 */
export const toQrOptions = (design: Design, encoded: string, size: number): Options => {
  const corners = resolveCorners(design);

  return {
    width: size,
    height: size,
    type: "svg",
    data: asQrBytes(encoded),
    margin: design.margin,
    image: design.logo?.dataUri,
    qrOptions: { errorCorrectionLevel: resolveErrorCorrection(design) },
    // The library merges these without a default, so it must always be an
    // object — an explicit `undefined` throws on construction.
    imageOptions: {
      imageSize: design.logo ? resolveLogoSize(design.logo.size) : 0,
      margin: design.logo?.margin ?? 0,
      hideBackgroundDots: design.logo?.hideBackgroundDots ?? true,
    },
    dotsOptions: {
      color: design.foreground,
      type: design.dotStyle,
      gradient: design.gradient ? toGradient(design.gradient) : undefined,
    },
    backgroundOptions: {
      color: design.transparentBackground ? "transparent" : design.background,
    },
    cornersSquareOptions: { color: corners.squareColor, type: corners.squareStyle },
    cornersDotOptions: { color: corners.dotColor, type: corners.dotStyle },
  };
};
