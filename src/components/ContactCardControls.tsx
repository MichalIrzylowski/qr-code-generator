import {
  addField,
  addressFromText,
  addressText,
  fieldKindsAvailable,
  removeField,
  replaceField,
  typesFor,
  type Address,
  type AddressParts,
  type ContactCard,
  type ContactField,
  type ContactFieldKind,
  type ContactFieldType,
} from "@/domain/contact.ts";
import { msg, type MessageKey } from "@/messages/index.ts";
import { Field, RemoveButton, Select, Textarea, Toggle, inputClass } from "./ui.tsx";

const kindLabel = (kind: ContactFieldKind) => msg(`contact.field.${kind}` as MessageKey);
const kindPlaceholder = (kind: ContactFieldKind) => msg(`contact.placeholder.${kind}` as MessageKey);
const typeLabel = (type: ContactFieldType) => msg(`contact.type.${type}` as MessageKey);

const ADDRESS_PARTS: (keyof AddressParts)[] = ["street", "city", "region", "postcode", "country"];

const AddressEditor = ({
  address,
  onChange,
}: {
  address: Address;
  onChange: (address: Address) => void;
}) => (
  <div className="space-y-2">
    {address.detailed ? (
      <div className="grid grid-cols-2 gap-2">
        {ADDRESS_PARTS.map((part) => (
          <input
            key={part}
            className={inputClass + (part === "street" ? " col-span-2" : "")}
            value={address[part]}
            aria-label={msg(`contact.address.${part}` as MessageKey)}
            placeholder={msg(`contact.address.${part}` as MessageKey)}
            onChange={(e) => onChange({ ...address, [part]: e.target.value })}
          />
        ))}
      </div>
    ) : (
      <Textarea
        value={address.text}
        placeholder={kindPlaceholder("address")}
        onChange={(text) => onChange({ detailed: false, text })}
      />
    )}

    {/* Collapsing is lossless; expanding is a guess the user is looking straight
        at and can correct. Neither direction discards what was typed. */}
    <Toggle
      label={msg("contact.address.detailed")}
      checked={address.detailed}
      onChange={(detailed) =>
        onChange(
          detailed
            ? { detailed: true, ...addressFromText(address.detailed ? "" : address.text) }
            : { detailed: false, text: address.detailed ? addressText(address) : "" },
        )
      }
    />
  </div>
);

const FieldRow = ({
  field,
  onChange,
  onRemove,
}: {
  field: ContactField;
  onChange: (field: ContactField) => void;
  onRemove: () => void;
}) => {
  const types = typesFor(field.kind);

  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <Field label={kindLabel(field.kind)}>
          {field.kind === "address" ? (
            <AddressEditor
              address={field.address}
              onChange={(address) => onChange({ ...field, address })}
            />
          ) : field.kind === "note" ? (
            <Textarea
              value={field.value}
              rows={2}
              placeholder={kindPlaceholder(field.kind)}
              onChange={(value) => onChange({ ...field, value })}
            />
          ) : (
            <input
              className={inputClass}
              value={field.value}
              spellCheck={false}
              placeholder={kindPlaceholder(field.kind)}
              onChange={(e) => onChange({ ...field, value: e.target.value })}
            />
          )}
        </Field>
      </div>

      {types.length > 0 && "type" in field && (
        <div className="w-28 shrink-0">
          <Field label="&nbsp;">
            <Select
              value={field.type}
              onChange={(type) => onChange({ ...field, type } as ContactField)}
              options={types.map((type) => ({ value: type, label: typeLabel(type) }))}
            />
          </Field>
        </div>
      )}

      <RemoveButton onClick={onRemove} label={msg("contact.remove", { field: kindLabel(field.kind) })} />
    </div>
  );
};

export const ContactCardControls = ({
  card,
  onChange,
}: {
  card: ContactCard;
  onChange: (card: ContactCard) => void;
}) => {
  const available = fieldKindsAvailable(card);

  return (
    <div className="space-y-3">
      {/* Both halves of the name, because Android sorts contacts by family name
          and a card that lands with the whole name in the given-name slot sorts
          wrong for as long as it exists. */}
      <div className="grid grid-cols-2 gap-2">
        <Field label={msg("contact.firstName.label")}>
          <input
            className={inputClass}
            value={card.firstName}
            onChange={(e) => onChange({ ...card, firstName: e.target.value })}
          />
        </Field>
        <Field label={msg("contact.lastName.label")}>
          <input
            className={inputClass}
            value={card.lastName}
            onChange={(e) => onChange({ ...card, lastName: e.target.value })}
          />
        </Field>
      </div>

      {card.fields.map((field) => (
        <FieldRow
          key={field.id}
          field={field}
          onChange={(updated) => onChange(replaceField(card, updated))}
          onRemove={() => onChange(removeField(card, field.id))}
        />
      ))}

      {/* A select rather than a button-plus-menu: adding is the act, and the
          control resets to its prompt so it never reads as a current choice. */}
      {available.length > 0 && (
        <select
          className={inputClass + " text-muted"}
          value=""
          onChange={(e) => onChange(addField(card, e.target.value as ContactFieldKind))}
        >
          <option value="" disabled>
            + {msg("contact.add")}
          </option>
          {available.map((kind) => (
            <option key={kind} value={kind}>
              {kindLabel(kind)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
