import type { ContactCard } from "@/domain/contact.ts";
import {
  PAYLOAD_KINDS,
  emptyPayload,
  inspectPayload,
  type Payload,
  type PayloadKind,
} from "@/domain/payload.ts";
import { msg, type MessageKey } from "@/messages/index.ts";
import { ContactCardControls } from "./ContactCardControls.tsx";
import { Field, Panel, Tabs, Textarea, inputClass } from "./ui.tsx";

/**
 * The Payload variant is the user's first choice, so it is tabs rather than a
 * setting buried in a menu. Switching starts the new variant blank: carrying a
 * URL across into a name field would only ever be wrong.
 */
export const PayloadControls = ({
  payload,
  onChange,
}: {
  payload: Payload;
  onChange: (payload: Payload) => void;
}) => {
  const issue = inspectPayload(payload);
  const hint =
    issue === "malformed-url" || issue === "contact-no-name"
      ? msg(`payload.issue.${issue}` as MessageKey)
      : undefined;

  return (
    <Panel title={msg("payload.title")} hint={msg("payload.hint")}>
      <Tabs
        label={msg("payload.title")}
        value={payload.kind}
        onChange={(kind: PayloadKind) => {
          if (kind !== payload.kind) onChange(emptyPayload(kind));
        }}
        options={PAYLOAD_KINDS.map((kind) => ({
          value: kind,
          label: msg(`payload.kind.${kind}` as MessageKey),
        }))}
      />

      {payload.kind === "url" && (
        <Field label={msg("payload.url.label")} hint={hint}>
          <input
            className={inputClass}
            value={payload.value}
            spellCheck={false}
            placeholder={msg("payload.url.placeholder")}
            onChange={(e) => onChange({ kind: "url", value: e.target.value })}
          />
        </Field>
      )}

      {payload.kind === "text" && (
        <Field label={msg("payload.text.label")}>
          <Textarea
            value={payload.value}
            placeholder={msg("payload.text.placeholder")}
            onChange={(value) => onChange({ kind: "text", value })}
          />
        </Field>
      )}

      {payload.kind === "contact" && (
        <>
          <p className="text-xs text-muted">{msg("contact.hint")}</p>
          <ContactCardControls
            card={payload.card}
            onChange={(card: ContactCard) => onChange({ kind: "contact", card })}
          />
          {hint && <p className="text-xs text-amber-700">{hint}</p>}
        </>
      )}
    </Panel>
  );
};
