import { useEffect, useState } from "react";
import type { Design } from "@/domain/design.ts";
import { exportBasename } from "@/domain/filename.ts";
import type { Payload } from "@/domain/payload.ts";
import { collectHints, describeHint } from "@/domain/scannability.ts";
import { SHARE_PARAM, encodeShare, shareOmitsLogo } from "@/domain/share.ts";
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

const BADGES: Record<CheckResult["status"], { tone: string; text: string }> = {
  pass: { tone: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "Scans correctly" },
  checking: { tone: "bg-slate-50 text-muted border-line", text: "Checking…" },
  fail: { tone: "bg-red-50 text-red-700 border-red-200", text: "Does not scan" },
  mismatch: {
    tone: "bg-red-50 text-red-700 border-red-200",
    text: "Scans, but decodes to the wrong thing",
  },
};

const Badge = ({ result }: { result: CheckResult | null }) => {
  if (!result) return null;

  const { tone, text } = BADGES[result.status];
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${tone}`}>{text}</span>
  );
};

export const PreviewPanel = ({
  design,
  payload,
  encoded,
  containerRef,
  svg,
}: {
  design: Design;
  payload: Payload;
  encoded: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
  svg: string | null;
}) => {
  const [target, setTarget] = useState<ExportTarget>("png");
  const [size, setSize] = useState(1024);
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const settledSvg = useDebounced(svg, 300);
  const hints = collectHints(design, encoded);

  useEffect(() => {
    if (!settledSvg || encoded === "") {
      setCheck(null);
      return;
    }

    let cancelled = false;
    setCheck({ status: "checking" });

    runScannabilityCheck(settledSvg, encoded)
      .then((result) => {
        if (!cancelled) setCheck(result);
      })
      .catch(() => {
        if (!cancelled) setCheck({ status: "fail" });
      });

    return () => {
      cancelled = true;
    };
  }, [settledSvg, encoded]);

  const onExport = async () => {
    if (!svg) return;
    setBusy(true);
    setExportError(null);
    try {
      await runExport(target, svg, size, exportBasename(payload));
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  const onShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?${SHARE_PARAM}=${encodeShare({ payload, design })}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  const flattening = design.transparentBackground && !targetSupportsTransparency(target);

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
        {/* The checkerboard is only honest when there is transparency to show. */}
        <div
          className={
            "flex aspect-square items-center justify-center rounded-lg p-4 " +
            (design.transparentBackground ? "checkerboard" : "")
          }
        >
          {encoded === "" ? (
            <p className="text-sm text-muted">Enter a URL to see your code.</p>
          ) : (
            <div ref={containerRef} className="[&_svg]:h-full [&_svg]:w-full h-full w-full" />
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <Badge result={check} />
          {check?.status === "mismatch" && (
            <span className="truncate text-xs text-muted" title={check.decoded}>
              Decoded: {check.decoded}
            </span>
          )}
        </div>

        {hints.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {hints.map((hint) => (
              <li key={hint.code} className="text-xs text-amber-700">
                {describeHint(hint)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-sm">
        <h2 className="text-sm font-semibold tracking-tight">Export</h2>

        <div className="grid grid-cols-2 gap-2">
          <Select
            value={target}
            onChange={setTarget}
            options={EXPORT_TARGETS.map((t) => ({ value: t.id, label: t.label }))}
          />
          <Select
            value={String(size)}
            onChange={(value) => setSize(Number(value))}
            options={SIZES.map((s) => ({ value: String(s), label: `${s} px` }))}
            disabled={!targetHasResolution(target)}
          />
        </div>

        {flattening && (
          <p className="text-xs text-amber-700">
            JPEG has no transparency — this export will be flattened onto white.
          </p>
        )}
        {exportError && <p className="text-xs text-red-600">{exportError}</p>}

        <div className="flex gap-2">
          <Button variant="primary" onClick={() => void onExport()} disabled={!svg || busy}>
            {busy ? "Working…" : `Download ${target.toUpperCase()}`}
          </Button>
          <Button onClick={() => void onShare()} title="Copy a link that reopens this design">
            {copied ? "Copied" : "Copy share link"}
          </Button>
        </div>

        {shareOmitsLogo(design) && (
          <p className="text-xs text-muted">
            The share link carries the design but not the logo — that stays on your machine.
          </p>
        )}
      </div>
    </div>
  );
};
