import jsQR from "jsqr";
import { rasteriseToImageData } from "./qr.ts";

/**
 * The Scannability Check: render the design and decode it back. This is a
 * measurement, not an estimate — if this passes, a scanner can read the code.
 */
export type CheckResult =
  | { status: "checking" }
  | { status: "pass"; decoded: string }
  | { status: "fail" }
  | { status: "mismatch"; decoded: string };

/** Big enough for the decoder to resolve dense codes, small enough to stay fast. */
const CHECK_SIZE = 512;

export const runScannabilityCheck = async (
  svg: string,
  expected: string,
): Promise<CheckResult> => {
  const imageData = await rasteriseToImageData(svg, CHECK_SIZE);
  const result = jsQR(imageData.data, imageData.width, imageData.height);

  if (!result) return { status: "fail" };
  if (result.data !== expected) return { status: "mismatch", decoded: result.data };
  return { status: "pass", decoded: result.data };
};
