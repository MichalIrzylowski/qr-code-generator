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
 * Translate a Design into `qr-code-styling` options. Enforcement is applied here
 * so there is no path to the renderer that bypasses it.
 */
export const toQrOptions = (design: Design, encoded: string, size: number): Options => {
  const corners = resolveCorners(design);

  return {
    width: size,
    height: size,
    type: "svg",
    data: encoded,
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
