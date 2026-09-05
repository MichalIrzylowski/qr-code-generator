import QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";

/**
 * `qr-code-styling` reaches for the DOM on construction, so every entry point
 * lives here rather than being imported at module scope elsewhere.
 */
export const createQrCode = (options: Options): QRCodeStyling => new QRCodeStyling(options);

export type RasterTarget = "png" | "jpeg";

/**
 * Draw an SVG string onto a canvas of the given size and hand the canvas to
 * `use`. The canvas is always filled white first: a transparent design must be
 * composited before it is read back, or every pixel reads as black.
 */
const withSvgOnCanvas = async <T,>(
  svg: string,
  size: number,
  opaque: boolean,
  use: (context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => T,
): Promise<T> => {
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));

  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not render the QR code."));
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas is unavailable in this browser.");

    if (opaque) {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size, size);
    }
    context.drawImage(image, 0, 0, size, size);

    return use(context, canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
};

/**
 * Rasterise a Design to a data URL.
 *
 * JPEG has no alpha channel, so a transparent design is flattened onto white
 * rather than being handed to the encoder to fill with black.
 */
export const rasterise = (svg: string, target: RasterTarget, size: number): Promise<string> =>
  withSvgOnCanvas(svg, size, target === "jpeg", (_, canvas) =>
    canvas.toDataURL(target === "png" ? "image/png" : "image/jpeg", 0.92),
  );

/** Read the pixels of a rendered code, for the Scannability Check to decode. */
export const rasteriseToImageData = (svg: string, size: number): Promise<ImageData> =>
  withSvgOnCanvas(svg, size, true, (context) => context.getImageData(0, 0, size, size));

export const svgToString = (element: SVGElement): string =>
  new XMLSerializer().serializeToString(element);
