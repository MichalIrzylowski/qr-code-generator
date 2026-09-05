import { CaptionControls } from "@/components/CaptionControls.tsx";
import { DesignControls } from "@/components/DesignControls.tsx";
import { PreviewPanel } from "@/components/PreviewPanel.tsx";
import { Field, Panel, inputClass } from "@/components/ui.tsx";
import { useArtefact } from "@/hooks/useArtefact.ts";
import { useQrDesign } from "@/hooks/useQrDesign.ts";
import { useQrPreview } from "@/hooks/useQrPreview.ts";
import { encodePayload, inspectPayload } from "@/domain/payload.ts";
import { msg } from "@/messages/index.ts";

export const App = () => {
  const { payload, design, caption, setPayload, updateDesign, updateCaption, applyDesign } =
    useQrDesign();
  const encoded = encodePayload(payload);
  const issue = inspectPayload(payload);
  const { containerRef, svg, size } = useQrPreview(design, encoded);
  const { artefact, captionReady, fontFailed } = useArtefact(svg, size, design, caption);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">{msg("app.title")}</h1>
        <p className="mt-1 text-sm text-muted">{msg("app.tagline")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel title={msg("payload.title")} hint={msg("payload.hint")}>
            <Field
              label={msg("payload.url.label")}
              hint={issue === "malformed-url" ? msg("payload.issue.malformed-url") : undefined}
            >
              <input
                className={inputClass}
                value={payload.value}
                spellCheck={false}
                placeholder={msg("payload.url.placeholder")}
                onChange={(e) => setPayload({ kind: "url", value: e.target.value })}
              />
            </Field>
          </Panel>

          <CaptionControls caption={caption} onChange={updateCaption} fontFailed={fontFailed} />

          <DesignControls design={design} onChange={updateDesign} onApplyPreset={applyDesign} />
        </div>

        {/* A sticky child needs a taller parent to move within, and a grid item
            stretches to the row height — so the sticky element cannot be the
            grid item itself. */}
        <div>
          <PreviewPanel
            qrDesign={{ payload, design, caption }}
            encoded={encoded}
            containerRef={containerRef}
            artefact={artefact}
            captionReady={captionReady}
          />
        </div>
      </div>
    </div>
  );
};
