import type {
  CornerDotStyle,
  CornerSquareStyle,
  Design,
  DotStyle,
  ErrorCorrectionLevel,
  Gradient,
} from "@/domain/design.ts";
import { MAX_LOGO_SIZE, resolveCorners, resolveErrorCorrection } from "@/domain/design.ts";
import { PRESETS } from "@/domain/presets.ts";
import { fileToDataUri } from "@/lib/download.ts";
import { Button, ColorInput, Disclosure, Field, Panel, Select, Slider, Toggle } from "./ui.tsx";
import { useEffect, useRef, useState } from "react";

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "extra-rounded", label: "Extra rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy rounded" },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Extra rounded" },
];

const CORNER_DOT_STYLES: { value: CornerDotStyle; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

const EC_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: "L", label: "L — 7% recovery" },
  { value: "M", label: "M — 15% recovery" },
  { value: "Q", label: "Q — 25% recovery" },
  { value: "H", label: "H — 30% recovery" },
];

const GRADIENT_TYPES: { value: Gradient["type"]; label: string }[] = [
  { value: "linear", label: "Linear" },
  { value: "radial", label: "Radial" },
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export const DesignControls = ({
  design,
  onChange,
  onApplyPreset,
}: {
  design: Design;
  onChange: (patch: Partial<Design>) => void;
  onApplyPreset: (design: Design) => void;
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const corners = resolveCorners(design);
  const enforcedEc = resolveErrorCorrection(design);
  const logo = design.logo;
  const gradient = design.gradient;

  // Paste anywhere on the page, rather than only when a particular div holds
  // focus — otherwise the advertised paste path is near-impossible to find.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files?.[0];
      if (file) void acceptLogo(file);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  });

  const acceptLogo = async (file: File | null | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|svg\+xml|webp)$/.test(file.type)) {
      setLogoError("Use a PNG, JPEG, SVG or WebP image.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("That image is over 2 MB. Try a smaller one.");
      return;
    }

    try {
      const dataUri = await fileToDataUri(file);
      setLogoError(null);
      onChange({
        logo: { dataUri, size: logo?.size ?? 0.2, hideBackgroundDots: true, margin: 4 },
      });
    } catch {
      setLogoError("Could not read that file.");
    }
  };

  return (
    <>
      <Panel title="Presets" hint="A starting point. Editing afterwards won't change the preset.">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button key={preset.id} onClick={() => onApplyPreset({ ...preset.design, logo: design.logo })}>
              {preset.name}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title="Style">
        <Field label="Dot style">
          <Select value={design.dotStyle} onChange={(dotStyle) => onChange({ dotStyle })} options={DOT_STYLES} />
        </Field>

        <Field label="Foreground">
          <ColorInput value={design.foreground} onChange={(foreground) => onChange({ foreground })} />
        </Field>

        <Field label="Background">
          <ColorInput value={design.background} onChange={(background) => onChange({ background })} />
        </Field>

        <Toggle
          checked={design.transparentBackground}
          onChange={(transparentBackground) => onChange({ transparentBackground })}
          label="Transparent background"
        />

        <Field label="Quiet zone">
          <Slider
            value={design.margin}
            min={0}
            max={40}
            step={1}
            onChange={(margin) => onChange({ margin })}
            format={(v) => `${v}px`}
          />
        </Field>
      </Panel>

      <Panel title="Corners">
        <Toggle
          checked={!design.corners.linked}
          onChange={(unlinked) =>
            onChange({
              corners: unlinked
                ? { linked: false, ...corners }
                : { linked: true },
            })
          }
          label="Style corners separately"
        />

        {!design.corners.linked && (
          <div className="space-y-3">
            <Field label="Corner frame">
              <Select
                value={design.corners.squareStyle}
                onChange={(squareStyle) =>
                  onChange({ corners: { ...corners, linked: false, squareStyle } })
                }
                options={CORNER_SQUARE_STYLES}
              />
            </Field>
            <Field label="Corner frame colour">
              <ColorInput
                value={design.corners.squareColor}
                onChange={(squareColor) =>
                  onChange({ corners: { ...corners, linked: false, squareColor } })
                }
              />
            </Field>
            <Field label="Corner centre">
              <Select
                value={design.corners.dotStyle}
                onChange={(dotStyle) => onChange({ corners: { ...corners, linked: false, dotStyle } })}
                options={CORNER_DOT_STYLES}
              />
            </Field>
            <Field label="Corner centre colour">
              <ColorInput
                value={design.corners.dotColor}
                onChange={(dotColor) => onChange({ corners: { ...corners, linked: false, dotColor } })}
              />
            </Field>
          </div>
        )}
      </Panel>

      <Panel title="Logo" hint="Read from your machine only — nothing is uploaded.">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={(e) => void acceptLogo(e.target.files?.[0])}
        />

        <div
          onPaste={(e) => void acceptLogo(e.clipboardData.files?.[0])}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void acceptLogo(e.dataTransfer.files?.[0]);
          }}
          tabIndex={0}
          className="flex items-center gap-3 rounded-lg border border-dashed border-line p-3 text-xs text-muted outline-none focus:border-accent"
        >
          {logo ? (
            <img src={logo.dataUri} alt="" className="h-10 w-10 rounded object-contain" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded bg-canvas text-base">＋</div>
          )}
          <div className="flex-1">
            Drop or paste an image here, or{" "}
            <button type="button" className="font-medium text-accent underline" onClick={() => fileRef.current?.click()}>
              choose a file
            </button>
            .
          </div>
          {logo && <Button onClick={() => onChange({ logo: null })}>Remove</Button>}
        </div>

        {logoError && <p className="text-xs text-red-600">{logoError}</p>}

        {logo && (
          <>
            <Field label="Logo size" hint={`Capped at ${MAX_LOGO_SIZE * 100}% so the code still scans.`}>
              <Slider
                value={logo.size}
                min={0.05}
                max={MAX_LOGO_SIZE}
                step={0.01}
                onChange={(size) => onChange({ logo: { ...logo, size } })}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Field>
            <Field label="Logo padding">
              <Slider
                value={logo.margin}
                min={0}
                max={20}
                step={1}
                onChange={(margin) => onChange({ logo: { ...logo, margin } })}
                format={(v) => `${v}px`}
              />
            </Field>
            <Toggle
              checked={logo.hideBackgroundDots}
              onChange={(hideBackgroundDots) => onChange({ logo: { ...logo, hideBackgroundDots } })}
              label="Clear dots behind the logo"
            />
          </>
        )}
      </Panel>

      <Disclosure label="Gradient">
        <Toggle
          checked={gradient !== null}
          onChange={(on) =>
            onChange({
              gradient: on
                ? { type: "linear", rotation: 45, from: design.foreground, to: "#7c3aed" }
                : null,
            })
          }
          label="Use a gradient instead of a flat colour"
        />

        {gradient && (
          <div className="space-y-3">
            <Field label="Gradient type">
              <Select
                value={gradient.type}
                onChange={(type) => onChange({ gradient: { ...gradient, type } })}
                options={GRADIENT_TYPES}
              />
            </Field>
            <Field label="From">
              <ColorInput
                value={gradient.from}
                onChange={(from) => onChange({ gradient: { ...gradient, from } })}
              />
            </Field>
            <Field label="To">
              <ColorInput
                value={gradient.to}
                onChange={(to) => onChange({ gradient: { ...gradient, to } })}
              />
            </Field>
            {gradient.type === "linear" && (
              <Field label="Angle">
                <Slider
                  value={gradient.rotation}
                  min={0}
                  max={360}
                  step={5}
                  onChange={(rotation) => onChange({ gradient: { ...gradient, rotation } })}
                  format={(v) => `${v}°`}
                />
              </Field>
            )}
            <p className="text-xs text-muted">
              Contrast is judged against the first colour, so keep that end dark.
            </p>
          </div>
        )}
      </Disclosure>

      <Disclosure label="Advanced">
        <Field
          label="Error correction"
          hint={
            design.logo
              ? "Held at H while a logo is present — the logo covers modules that recovery data replaces."
              : "Higher recovery survives damage but makes a denser code."
          }
        >
          <Select
            value={enforcedEc}
            onChange={(errorCorrection) => onChange({ errorCorrection })}
            options={EC_LEVELS}
            disabled={design.logo !== null}
          />
        </Field>
      </Disclosure>
    </>
  );
};
