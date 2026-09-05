import {
  CAPTION_SIZES,
  MAX_CAPTION_LENGTH,
  clampCaptionText,
  resolveCaption,
  type Caption,
} from "@/domain/caption.ts";
import { msg } from "@/messages/index.ts";
import { ColorInput, Field, Panel, Select } from "./ui.tsx";

export const CaptionControls = ({
  caption,
  onChange,
  fontFailed,
}: {
  caption: Caption;
  onChange: (patch: Partial<Caption>) => void;
  fontFailed: boolean;
}) => (
  <Panel title={msg("caption.title")} hint={msg("caption.hint")}>
    <Field
      label={msg("caption.text.label")}
      hint={msg("caption.text.remaining", {
        remaining: MAX_CAPTION_LENGTH - clampCaptionText(caption.text).length,
      })}
    >
      <input
        className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        value={caption.text}
        // The cap is Enforcement, applied in the domain; this is a courtesy so
        // the field stops accepting keystrokes it would only throw away.
        maxLength={MAX_CAPTION_LENGTH}
        placeholder={msg("caption.text.placeholder")}
        onChange={(e) => onChange({ text: e.target.value })}
      />
    </Field>

    {resolveCaption(caption) !== null && (
      <>
        <Field label={msg("caption.size.label")}>
          <Select
            value={caption.size}
            onChange={(size) => onChange({ size })}
            options={CAPTION_SIZES.map((size) => ({ value: size, label: msg(`caption.size.${size}`) }))}
          />
        </Field>

        <Field label={msg("caption.color.label")}>
          <ColorInput value={caption.color} onChange={(color) => onChange({ color })} />
        </Field>
      </>
    )}

    {fontFailed && <p className="text-xs text-red-600">{msg("caption.font.error")}</p>}
  </Panel>
);
