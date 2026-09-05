import jsQR from "jsqr";
import { scaleToWidth, type Artefact } from "./artefact.ts";
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
const CHECK_WIDTH = 512;

/**
 * The artefact is rendered whole and decoded from the code's square alone.
 *
 * Handing the Caption's pixels to `jsQR` makes it fail on codes that every real
 * scanner reads: its locator treats a block of dense text as a rival candidate
 * and gives up. Whitening only the caption band decodes the very same
 * non-square image, so the failure is the decoder's, not the artefact's — and a
 * Check that reports what the decoder cannot cope with instead of what the user
 * receives would be worse than useless.
 *
 * Nothing is lost by cropping: a Caption always sits *below* the code's full
 * quiet zone, so it cannot interfere with decoding by construction. If a future
 * change lets a Caption encroach on that zone, this crop has to go with it.
 */
export const runScannabilityCheck = async (
  artefact: Artefact,
  expected: string,
): Promise<CheckResult> => {
  const { width, height } = scaleToWidth(artefact, CHECK_WIDTH);
  const code = { width, height: Math.min(width, height) };
  const imageData = await rasteriseToImageData(artefact.svg, width, height, code);
  const result = jsQR(imageData.data, imageData.width, imageData.height);

  if (!result) return { status: "fail" };
  if (result.data !== expected) return { status: "mismatch", decoded: result.data };
  return { status: "pass", decoded: result.data };
};
