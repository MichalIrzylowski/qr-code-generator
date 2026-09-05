import { useEffect, useMemo, useState } from "react";
import type { Font } from "opentype.js";
import { resolveCaption, type Caption } from "@/domain/caption.ts";
import type { Design } from "@/domain/design.ts";
import { composeArtefact, loadCaptionFont, type Artefact } from "@/lib/artefact.ts";

/**
 * Turn the library's square code into the artefact the user actually gets.
 *
 * The code shows immediately and the Caption arrives once its font has loaded,
 * rather than holding the whole preview on a network round trip. Export is
 * gated on `captionReady` instead: a caption that cannot be composed must never
 * become a silently caption-less download.
 */
export const useArtefact = (
  codeSvg: string | null,
  codeSize: number,
  design: Design,
  caption: Caption,
): { artefact: Artefact | null; captionReady: boolean; fontFailed: boolean } => {
  const resolved = useMemo(() => resolveCaption(caption), [caption]);
  const [font, setFont] = useState<Font | null>(null);
  const [fontFailed, setFontFailed] = useState(false);

  useEffect(() => {
    if (resolved === null || font !== null) return;

    let cancelled = false;
    loadCaptionFont().then(
      (loaded) => {
        if (cancelled) return;
        setFont(loaded);
        setFontFailed(false);
      },
      () => {
        if (!cancelled) setFontFailed(true);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [resolved, font]);

  const artefact = useMemo((): Artefact | null => {
    if (codeSvg === null) return null;
    const bare = { svg: codeSvg, width: codeSize, height: codeSize };
    if (resolved === null || font === null) return bare;
    return composeArtefact(codeSvg, codeSize, design, resolved, font);
  }, [codeSvg, codeSize, design, resolved, font]);

  return { artefact, captionReady: resolved === null || font !== null, fontFailed };
};
