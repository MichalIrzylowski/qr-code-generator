import { DesignControls } from "@/components/DesignControls.tsx";
import { PreviewPanel } from "@/components/PreviewPanel.tsx";
import { Field, Panel, inputClass } from "@/components/ui.tsx";
import { useQrDesign } from "@/hooks/useQrDesign.ts";
import { useQrPreview } from "@/hooks/useQrPreview.ts";
import { encodePayload, inspectPayload } from "@/domain/payload.ts";

const ISSUE_TEXT = {
  empty: null,
  "malformed-url": "That doesn't look like a valid URL, but the code will still encode it.",
} as const;

export const App = () => {
  const { payload, design, setPayload, updateDesign, applyDesign } = useQrDesign();
  const encoded = encodePayload(payload);
  const issue = inspectPayload(payload);
  const { containerRef, svg } = useQrPreview(design, encoded);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">QR Code Generator</h1>
        <p className="mt-1 text-sm text-muted">
          Everything happens in this tab. No account, no upload, no email — your links never leave
          your browser.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Panel title="Payload" hint="What the code encodes.">
            <Field label="URL" hint={issue ? (ISSUE_TEXT[issue] ?? undefined) : undefined}>
              <input
                className={inputClass}
                value={payload.value}
                spellCheck={false}
                placeholder="example.com"
                onChange={(e) => setPayload({ kind: "url", value: e.target.value })}
              />
            </Field>
          </Panel>

          <DesignControls design={design} onChange={updateDesign} onApplyPreset={applyDesign} />
        </div>

        {/* A sticky child needs a taller parent to move within, and a grid item
            stretches to the row height — so the sticky element cannot be the
            grid item itself. */}
        <div>
          <PreviewPanel
            design={design}
            payload={payload}
            encoded={encoded}
            containerRef={containerRef}
            svg={svg}
          />
        </div>
      </div>
    </div>
  );
};
