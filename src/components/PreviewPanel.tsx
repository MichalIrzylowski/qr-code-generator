import { useEffect, useState } from "react";
import type { QrDesign } from "@/domain/design.ts";
import { exportBasename } from "@/domain/filename.ts";
import { collectHints, describeHint } from "@/domain/scannability.ts";
import { SHARE_PARAM, encodeShare, shareOmitsLogo } from "@/domain/share.ts";
import { msg, type MessageKey } from "@/messages/index.ts";
import type { Artefact } from "@/lib/artefact.ts";
import {
  EXPORT_TARGETS,
  runExport,
  targetHasResolution,
  targetSupportsTransparency,
  type ExportTarget,
} from "@/lib/export.ts";
import { runScannabilityCheck, type CheckResult } from "@/lib/scannabilityCheck.ts";
import { useDebounced } from "@/hooks/useDebounced.ts";
import { Button, Select } from "./ui.tsx";

const SIZES = [512, 1024, 2048];

const BADGES: Record<CheckResult["status"], { tone: string; key: MessageKey }> = {
  pass: { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", key: "check.pass" },
  checking: { tone: "bg-slate-50 text-muted border-line", key: "check.checking" },
  fail: { tone: "bg-red-50 text-red-700 border-red-200", key: "check.fail" },
  mismatch: { tone: "bg-red-50 text-red-700 border-red-200", key: "check.mismatch" },
};

const Badge = ({ result }: { result: CheckResult | null }) => {
  if (!result) return null;

  const { tone, key } = BADGES[result.status];
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{msg(key)}</span>
  );
};

export const PreviewPanel = ({
  qrDesign,
  encoded,
  containerRef,
  artefact,
  captionReady,
}: {
  qrDesign: QrDesign;
  encoded: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  artefact: Artefact | null;
  captionReady: boolean;
}) => {
  const { design, payload } = qrDesign;
  const [target, setTarget] = useState<ExportTarget>("png");
  const [size, setSize] = useState(1024);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const settledArtefact = useDebounced(artefact, 300);
  const hints = collectHints(design, encoded);

  useEffect(() => {
    if (!settledArtefact || encoded === "") {
      setCheck(null);
      return;
    }

    let cancelled = false;
    setCheck({ status: "checking" });

    runScannabilityCheck(settledArtefact, encoded)
      .then((result) => {
        if (!cancelled) setCheck(result);
      })
      .catch(() => {
        if (!cancelled) setCheck({ status: "fail" });
      });

    return () => {
      cancelled = true;
    };
  }, [settledArtefact, encoded]);

  const onExport = async () => {
    if (!artefact) return;
    setBusy(true);
    setExportError(null);
    try {
      await runExport(target, artefact, size, exportBasename(payload));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : msg("export.failed"));
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${SHARE_PARAM}=${encodeShare(qrDesign)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(msg("share.prompt"), url);
    }
  };

  const flattening = design.transparentBackground && !targetSupportsTransparency(target);

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        {/* The library draws into its own node, which is only ever the *source*
            of the code SVG — the artefact shown here is the composed one, so
            preview, export and Scannability Check are all the same bytes. */}
        <div ref={containerRef} aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden" />

        {/* The checkerboard is only honest when there is transparency to show. */}
        <div
          className={
            "flex min-h-64 items-center justify-center rounded-lg p-4 " +
            (design.transparentBackground ? "checkerboard" : "")
          }
        >
          {encoded === "" || !artefact ? (
            <p className="text-sm text-muted">{msg("preview.empty")}</p>
          ) : (
            <div
              className="[&_svg]:h-auto [&_svg]:w-full w-full"
              // Every part of this is generated: the code by the library, the
              // caption as path data. No user text reaches the DOM as markup.
              dangerouslySetInnerHTML={{ __html: artefact.svg }}
            />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge result={check} />
          {check?.status === "mismatch" && (
            <span className="truncate text-xs text-muted" title={check.decoded}>
              {msg("preview.decoded", { decoded: check.decoded })}
            </span>
          )}
        </div>

        {hints.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {hints.map((hint) => (
              <li key={hint.code} className="text-xs text-amber-700">
                {describeHint(hint, msg)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">{msg("export.title")}</h2>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={target}
            onChange={setTarget}
            options={EXPORT_TARGETS.map((target_) => ({ value: target_.id, label: target_.label }))}
          />
          <Select
            value={String(size)}
            onChange={(value) => setSize(Number(value))}
            options={SIZES.map((s) => ({ value: String(s), label: msg("export.size", { size: s }) }))}
            disabled={!targetHasResolution(target)}
          />
        </div>

        {flattening && <p className="text-xs text-amber-700">{msg("export.flattening")}</p>}
        {exportError && <p className="text-xs text-red-600">{exportError}</p>}

        <div className="flex gap-2">
          {/* A caption that cannot be composed must not become a download that
              silently lacks it. */}
          <Button
            variant="primary"
            onClick={() => void onExport()}
            disabled={!artefact || !captionReady || busy}
          >
            {busy ? msg("export.working") : msg("export.download", { target: target.toUpperCase() })}
          </Button>
          <Button onClick={() => void onShare()} title={msg("share.title")}>
            {copied ? msg("share.copied") : msg("share.copy")}
          </Button>
        </div>

        {shareOmitsLogo(design) && <p className="text-xs text-muted">{msg("share.omitsLogo")}</p>}
      </div>
    </div>
  );
};
