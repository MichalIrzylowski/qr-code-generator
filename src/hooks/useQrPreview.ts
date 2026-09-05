import { useEffect, useRef, useState } from "react";
import type { Design } from "@/domain/design.ts";
import { toQrOptions } from "@/domain/qrOptions.ts";
import { createQrCode, svgToString } from "@/lib/qr.ts";

const PREVIEW_SIZE = 512;

/**
 * Own the `qr-code-styling` instance and keep it in step with the Design,
 * exposing the rendered SVG as a string for the Scannability Check and exports
 * to work from — so what gets checked is exactly what gets exported.
 */
export const useQrPreview = (design: Design, encoded: string) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const codeRef = useRef<ReturnType<typeof createQrCode> | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // An empty payload makes the library throw rather than render nothing.
    if (encoded === "") {
      container.replaceChildren();
      codeRef.current = null;
      setSvg(null);
      return;
    }

    const options = toQrOptions(design, encoded, PREVIEW_SIZE);

    // The cached instance can outlive the node it drew into (a remount hands us
    // a fresh, empty container), and updating it then writes into a detached
    // node — a blank preview. Re-append whenever the container is empty.
    if (!codeRef.current) {
      codeRef.current = createQrCode(options);
      codeRef.current.append(container);
    } else if (container.childElementCount === 0) {
      codeRef.current.update(options);
      codeRef.current.append(container);
    } else {
      codeRef.current.update(options);
    }

    // The library mutates the DOM synchronously, but a Logo Overlay is fetched
    // and drawn asynchronously, so read back once immediately and again shortly
    // after — otherwise the Scannability Check would inspect a logo-less code.
    const read = () => {
      const element = container.querySelector("svg");
      setSvg(element ? svgToString(element) : null);
    };

    const frame = requestAnimationFrame(read);
    const settle = design.logo ? setTimeout(read, 250) : undefined;

    return () => {
      cancelAnimationFrame(frame);
      if (settle !== undefined) clearTimeout(settle);
    };
  }, [design, encoded]);

  return { containerRef, svg, size: PREVIEW_SIZE };
};
