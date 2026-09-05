import type {
  CornerDotStyle,
  CornerSquareStyle,
  Design,
  DotStyle,
  ErrorCorrectionLevel,
  Gradient,
} from "@/domain/design.ts";
import { MAX_LOGO_SIZE, resolveCorners, resolveErrorCorrection } from "@/domain/design.ts";
import { PRESETS, type PresetId } from "@/domain/presets.ts";
import type { MessageKey } from "@/messages/en.ts";
import { msg } from "@/messages/index.ts";
import { fileToDataUri } from "@/lib/download.ts";
import { Button, ColorInput, Disclosure, Field, Panel, Select, Slider, Toggle } from "./ui.tsx";
import { useEffect, useRef, useState } from "react";

const DOT_STYLES: { value: DotStyle; label: string }[] = [
  { value: "square", label: msg("dot.square") },
  { value: "dots", label: msg("dot.dots") },
  { value: "rounded", label: msg("dot.rounded") },
  { value: "extra-rounded", label: msg("dot.extra-rounded") },
  { value: "classy", label: msg("dot.classy") },
  { value: "classy-rounded", label: msg("dot.classy-rounded") },
];

const CORNER_SQUARE_STYLES: { value: CornerSquareStyle; label: string }[] = [
  { value: "square", label: msg("corners.style.square") },
  { value: "dot", label: msg("corners.style.dot") },
  { value: "extra-rounded", label: msg("corners.style.extra-rounded") },
];

const CORNER_DOT_STYLES: { value: CornerDotStyle; label: string }[] = [
  { value: "square", label: msg("corners.style.square") },
  { value: "dot", label: msg("corners.style.dot") },
];

const EC_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: "L", label: msg("ec.L") },
  { value: "M", label: msg("ec.M") },
  { value: "Q", label: msg("ec.Q") },
  { value: "H", label: msg("ec.H") },
];

const GRADIENT_TYPES: { value: Gradient["type"]; label: string }[] = [
  { value: "linear", label: msg("gradient.type.linear") },
  { value: "radial", label: msg("gradient.type.radial") },
];

/** Naming a Preset is copy, so it lives here rather than in the domain. */
const PRESET_NAMES: Record<PresetId, MessageKey> = {
  classic: "preset.classic",
  rounded: "preset.rounded",
  dots: "preset.dots",
  classy: "preset.classy",
  punch: "preset.punch",
};

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
      setLogoError(msg("logo.error.type"));
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(msg("logo.error.size"));
      return;
    }

    try {
      const dataUri = await fileToDataUri(file);
      setLogoError(null);
      onChange({
        logo: { dataUri, size: logo?.size ?? 0.2, hideBackgroundDots: true, margin: 4 },
      });
    } catch {
      setLogoError(msg("logo.error.read"));
    }
  };

  return (
    <>
      <Panel title={msg("preset.title")} hint={msg("preset.hint")}>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button key={preset.id} onClick={() => onApplyPreset({ ...preset.design, logo: design.logo })}>
              {msg(PRESET_NAMES[preset.id])}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title={msg("style.title")}>
        <Field label={msg("style.dotStyle.label")}>
          <Select value={design.dotStyle} onChange={(dotStyle) => onChange({ dotStyle })} options={DOT_STYLES} />
        </Field>

        <Field label={msg("style.foreground.label")}>
          <ColorInput value={design.foreground} onChange={(foreground) => onChange({ foreground })} />
        </Field>

        <Field label={msg("style.background.label")}>
          <ColorInput value={design.background} onChange={(background) => onChange({ background })} />
        </Field>

        <Toggle
          checked={design.transparentBackground}
          onChange={(transparentBackground) => onChange({ transparentBackground })}
          label={msg("style.transparent.label")}
        />

        <Field label={msg("style.margin.label")}>
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

      <Panel title={msg("corners.title")}>
        <Toggle
          checked={!design.corners.linked}
          onChange={(unlinked) =>
            onChange({
              corners: unlinked
                ? { linked: false, ...corners }
                : { linked: true },
            })
          }
          label={msg("corners.unlink.label")}
        />

        {!design.corners.linked && (
          <div className="space-y-3">
            <Field label={msg("corners.square.label")}>
              <Select
                value={design.corners.squareStyle}
                onChange={(squareStyle) =>
                  onChange({ corners: { ...corners, linked: false, squareStyle } })
                }
                options={CORNER_SQUARE_STYLES}
              />
            </Field>
            <Field label={msg("corners.squareColor.label")}>
              <ColorInput
                value={design.corners.squareColor}
                onChange={(squareColor) =>
                  onChange({ corners: { ...corners, linked: false, squareColor } })
                }
              />
            </Field>
            <Field label={msg("corners.dot.label")}>
              <Select
                value={design.corners.dotStyle}
                onChange={(dotStyle) => onChange({ corners: { ...corners, linked: false, dotStyle } })}
                options={CORNER_DOT_STYLES}
              />
            </Field>
            <Field label={msg("corners.dotColor.label")}>
              <ColorInput
                value={design.corners.dotColor}
                onChange={(dotColor) => onChange({ corners: { ...corners, linked: false, dotColor } })}
              />
            </Field>
          </div>
        )}
      </Panel>

      <Panel title={msg("logo.title")} hint={msg("logo.hint")}>
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
            {msg("logo.drop")}{" "}
            <button type="button" className="font-medium text-accent underline" onClick={() => fileRef.current?.click()}>
              {msg("logo.choose")}
            </button>
            .
          </div>
          {logo && <Button onClick={() => onChange({ logo: null })}>{msg("logo.remove")}</Button>}
        </div>

        {logoError && <p className="text-xs text-red-600">{logoError}</p>}

        {logo && (
          <>
            <Field
              label={msg("logo.size.label")}
              hint={msg("logo.size.hint", { percent: MAX_LOGO_SIZE * 100 })}
            >
              <Slider
                value={logo.size}
                min={0.05}
                max={MAX_LOGO_SIZE}
                step={0.01}
                onChange={(size) => onChange({ logo: { ...logo, size } })}
                format={(v) => `${Math.round(v * 100)}%`}
              />
            </Field>
            <Field label={msg("logo.padding.label")}>
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
              label={msg("logo.hideDots.label")}
            />
          </>
        )}
      </Panel>

      <Disclosure label={msg("gradient.title")}>
        <Toggle
          checked={gradient !== null}
          onChange={(on) =>
            onChange({
              gradient: on
                ? { type: "linear", rotation: 45, from: design.foreground, to: "#7c3aed" }
                : null,
            })
          }
          label={msg("gradient.enable.label")}
        />

        {gradient && (
          <div className="space-y-3">
            <Field label={msg("gradient.type.label")}>
              <Select
                value={gradient.type}
                onChange={(type) => onChange({ gradient: { ...gradient, type } })}
                options={GRADIENT_TYPES}
              />
            </Field>
            <Field label={msg("gradient.from.label")}>
              <ColorInput
                value={gradient.from}
                onChange={(from) => onChange({ gradient: { ...gradient, from } })}
              />
            </Field>
            <Field label={msg("gradient.to.label")}>
              <ColorInput
                value={gradient.to}
                onChange={(to) => onChange({ gradient: { ...gradient, to } })}
              />
            </Field>
            {gradient.type === "linear" && (
              <Field label={msg("gradient.angle.label")}>
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
              {msg("gradient.note")}
            </p>
          </div>
        )}
      </Disclosure>

      <Disclosure label={msg("advanced.title")}>
        <Field
          label={msg("ec.label")}
          hint={
            design.logo
              ? msg("ec.hint.enforced")
              : msg("ec.hint.free")
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
