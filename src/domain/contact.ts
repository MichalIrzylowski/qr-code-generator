/**
 * A Contact card is the Payload variant that encodes a person. It is written
 * out as vCard 3.0 (ADR-0004 covers the sharing consequence), but that word
 * never reaches the user: the encoding is an implementation detail of a thing
 * they think of as a contact card.
 *
 * Unlike the string variants, a card is structured — a Name plus a list of
 * Fields the user added. Fields are a list rather than a record because the
 * repeatable kinds genuinely occur more than once and their order is the order
 * they were added, which is the order they should encode in.
 */

export type ContactFieldKind =
  | "phone"
  | "email"
  | "website"
  | "organisation"
  | "jobTitle"
  | "address"
  | "note";

/** The vCard 3.0 TYPE values worth offering. Which apply depends on the kind. */
export type ContactFieldType = "mobile" | "work" | "home";

export type AddressParts = {
  street: string;
  city: string;
  region: string;
  postcode: string;
  country: string;
};

/**
 * An address is one textarea until the user asks for more. The two shapes are
 * convertible: collapsing is lossless, expanding is a guess the user is looking
 * straight at and can correct.
 */
export type Address = ({ detailed: false; text: string } | ({ detailed: true } & AddressParts));

export type ContactField =
  | { id: number; kind: "phone" | "email"; type: ContactFieldType; value: string }
  | { id: number; kind: "website" | "organisation" | "jobTitle" | "note"; value: string }
  | { id: number; kind: "address"; type: "work" | "home"; address: Address };

export type ContactCard = {
  firstName: string;
  lastName: string;
  fields: ContactField[];
};

export const EMPTY_CARD: ContactCard = { firstName: "", lastName: "", fields: [] };

export const EMPTY_ADDRESS_PARTS: AddressParts = {
  street: "",
  city: "",
  region: "",
  postcode: "",
  country: "",
};

/**
 * Everything that varies by kind, in one place: whether a card may hold more
 * than one, which types it offers, what it defaults to and which vCard property
 * it writes. Kept as a single record rather than four parallel switches so that
 * adding a kind is one entry rather than a hunt.
 *
 * Two phone numbers are indistinguishable without a type, which is most of the
 * point of allowing two. A website offers none: vCard 3.0 gives `URL` no TYPE
 * parameter, and two links tell themselves apart by their text anyway.
 */
type KindSpec = {
  repeatable: boolean;
  types: ContactFieldType[];
  defaultType: ContactFieldType;
  property: string;
};

const KINDS: Record<ContactFieldKind, KindSpec> = {
  phone: { repeatable: true, types: ["mobile", "work", "home"], defaultType: "mobile", property: "TEL" },
  email: { repeatable: true, types: ["mobile", "work", "home"], defaultType: "work", property: "EMAIL" },
  website: { repeatable: true, types: [], defaultType: "work", property: "URL" },
  organisation: { repeatable: false, types: [], defaultType: "work", property: "ORG" },
  jobTitle: { repeatable: false, types: [], defaultType: "work", property: "TITLE" },
  address: { repeatable: true, types: ["work", "home"], defaultType: "home", property: "ADR" },
  note: { repeatable: false, types: [], defaultType: "work", property: "NOTE" },
};

/**
 * Menu order, which is also roughly descending likelihood. Name is not here:
 * it is always present and cannot be removed.
 */
export const FIELD_KINDS: ContactFieldKind[] = [
  "phone",
  "email",
  "website",
  "organisation",
  "jobTitle",
  "address",
  "note",
];

export const isRepeatable = (kind: ContactFieldKind): boolean => KINDS[kind].repeatable;

export const typesFor = (kind: ContactFieldKind): ContactFieldType[] => KINDS[kind].types;

export const createField = (kind: ContactFieldKind, id: number): ContactField => {
  const { defaultType } = KINDS[kind];
  if (kind === "phone" || kind === "email") return { id, kind, type: defaultType, value: "" };
  if (kind === "address")
    return { id, kind, type: defaultType as "work" | "home", address: { detailed: false, text: "" } };
  return { id, kind, value: "" };
};

/** Which kinds the "add a field" menu should still offer for this card. */
export const fieldKindsAvailable = (card: ContactCard): ContactFieldKind[] =>
  FIELD_KINDS.filter((kind) => isRepeatable(kind) || !card.fields.some((f) => f.kind === kind));

/**
 * Ids only have to be unique within a card, and only so that React and removal
 * can tell two rows of the same kind apart.
 */
export const addField = (card: ContactCard, kind: ContactFieldKind): ContactCard => {
  const id = card.fields.reduce((highest, field) => Math.max(highest, field.id), 0) + 1;
  return { ...card, fields: [...card.fields, createField(kind, id)] };
};

export const replaceField = (card: ContactCard, updated: ContactField): ContactCard => ({
  ...card,
  fields: card.fields.map((field) => (field.id === updated.id ? updated : field)),
});

export const removeField = (card: ContactCard, id: number): ContactCard => ({
  ...card,
  fields: card.fields.filter((field) => field.id !== id),
});

export const addressText = (parts: AddressParts): string =>
  [parts.street, parts.city, parts.region, parts.postcode, parts.country]
    .map((part) => part.trim())
    .filter((part) => part !== "")
    .join("\n");

/**
 * Read a typed address back into components. A guess, deliberately: the user
 * only ever sees it having just asked for the detailed view, with every
 * component editable in front of them. Region is left alone — people write a
 * region into a free-text address far less often than the four that are read.
 */
export const addressFromText = (text: string): AddressParts => {
  const tokens = text
    .split(/[\n,]/)
    .map((token) => token.trim())
    .filter((token) => token !== "");

  const parts = { ...EMPTY_ADDRESS_PARTS };
  if (tokens.length >= 4) parts.country = tokens.pop() as string;
  if (tokens.length >= 3) parts.postcode = tokens.pop() as string;
  if (tokens.length >= 2) parts.city = tokens.pop() as string;
  parts.street = tokens.join(", ");
  return parts;
};

const addressIsBlank = (address: Address): boolean =>
  address.detailed ? addressText(address) === "" : address.text.trim() === "";

const fieldIsBlank = (field: ContactField): boolean =>
  field.kind === "address" ? addressIsBlank(field.address) : field.value.trim() === "";

/** A Contact card is empty when every one of its Fields is blank, Name included. */
export const isCardEmpty = (card: ContactCard): boolean =>
  card.firstName.trim() === "" &&
  card.lastName.trim() === "" &&
  card.fields.every(fieldIsBlank);

export const cardDisplayName = (card: ContactCard): string =>
  [card.firstName.trim(), card.lastName.trim()].filter((part) => part !== "").join(" ");

/** Characters that would otherwise end a property or a component. */
const escapeValue = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

const VCARD_TYPE: Record<ContactFieldType, string> = {
  mobile: "CELL",
  work: "WORK",
  home: "HOME",
};

const addressComponents = (address: Address): string[] =>
  address.detailed
    ? ["", "", address.street, address.city, address.region, address.postcode, address.country]
    : ["", "", address.text.trim(), "", "", "", ""];

const encodeField = (field: ContactField): string | null => {
  if (fieldIsBlank(field)) return null;

  const { property } = KINDS[field.kind];

  if (field.kind === "address") {
    const components = addressComponents(field.address).map(escapeValue).join(";");
    return `${property};TYPE=${VCARD_TYPE[field.type]}:${components}`;
  }

  const type = "type" in field ? `;TYPE=${VCARD_TYPE[field.type]}` : "";
  return `${property}${type}:${escapeValue(field.value.trim())}`;
};

/**
 * Write the card as vCard 3.0. Long lines are left unfolded: every scanner and
 * contacts app in practice reads them, and folding would put a line break in the
 * middle of a value that the Scannability Check then has to reason about.
 */
export const encodeVCard = (card: ContactCard): string => {
  if (isCardEmpty(card)) return "";

  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  const display = cardDisplayName(card);
  if (display !== "") {
    lines.push(
      `N:${escapeValue(card.lastName.trim())};${escapeValue(card.firstName.trim())};;;`,
      `FN:${escapeValue(display)}`,
    );
  }

  for (const field of card.fields) {
    const line = encodeField(field);
    if (line !== null) lines.push(line);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
};
