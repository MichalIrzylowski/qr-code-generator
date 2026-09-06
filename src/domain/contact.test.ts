import { describe, expect, it } from "vitest";
import {
  EMPTY_CARD,
  addField,
  removeField,
  replaceField,
  addressFromText,
  addressText,
  cardDisplayName,
  createField,
  encodeVCard,
  fieldKindsAvailable,
  isCardEmpty,
  type ContactCard,
  type ContactField,
} from "./contact.ts";

const card = (over: Partial<ContactCard> = {}): ContactCard => ({ ...EMPTY_CARD, ...over });

const field = (id: number, kind: ContactField["kind"], over: object = {}): ContactField =>
  ({ ...createField(kind, id), ...over }) as ContactField;

describe("isCardEmpty", () => {
  it("is empty when nothing is filled", () => {
    expect(isCardEmpty(EMPTY_CARD)).toBe(true);
  });

  it("is empty when added fields are all blank", () => {
    expect(isCardEmpty(card({ fields: [createField("phone", 1), createField("email", 2)] }))).toBe(
      true,
    );
  });

  it("is not empty with only a phone number", () => {
    expect(isCardEmpty(card({ fields: [field(1, "phone", { value: "07700 900123" })] }))).toBe(
      false,
    );
  });

  it("is not empty with only a name", () => {
    expect(isCardEmpty(card({ firstName: "Jane" }))).toBe(false);
  });

  it("ignores whitespace-only values", () => {
    expect(isCardEmpty(card({ lastName: "   " }))).toBe(true);
  });

  it("sees a filled address as content", () => {
    const address = field(1, "address", { address: { detailed: false, text: "12 High Street" } });
    expect(isCardEmpty(card({ fields: [address] }))).toBe(false);
  });
});

describe("cardDisplayName", () => {
  it("joins both parts", () => {
    expect(cardDisplayName(card({ firstName: "Jane", lastName: "Doe" }))).toBe("Jane Doe");
  });

  it("copes with only one part", () => {
    expect(cardDisplayName(card({ lastName: "Doe" }))).toBe("Doe");
  });

  it("is blank when unnamed", () => {
    expect(cardDisplayName(EMPTY_CARD)).toBe("");
  });
});

describe("fieldKindsAvailable", () => {
  it("offers everything on an empty card", () => {
    expect(fieldKindsAvailable(EMPTY_CARD)).toEqual([
      "phone",
      "email",
      "website",
      "organisation",
      "jobTitle",
      "address",
      "note",
    ]);
  });

  it("keeps offering repeatable kinds", () => {
    expect(fieldKindsAvailable(card({ fields: [createField("phone", 1)] }))).toContain("phone");
  });

  it("withdraws a singular kind once used", () => {
    const used = card({ fields: [createField("note", 1)] });
    expect(fieldKindsAvailable(used)).not.toContain("note");
    expect(fieldKindsAvailable(used)).toContain("phone");
  });
});

describe("field defaults", () => {
  it("assumes a new phone is a mobile", () => {
    expect(createField("phone", 1)).toMatchObject({ type: "mobile" });
  });

  it("assumes a new email is a work address", () => {
    expect(createField("email", 1)).toMatchObject({ type: "work" });
  });

  it("assumes a new address is a home one", () => {
    expect(createField("address", 1)).toMatchObject({ type: "home" });
  });

  it("gives a website no type, since vCard 3.0 has no grammar for one", () => {
    expect(createField("website", 1)).not.toHaveProperty("type");
  });
});

describe("card operations", () => {
  it("adds a field with an id nothing else holds", () => {
    const two = addField(addField(EMPTY_CARD, "phone"), "phone");
    expect(new Set(two.fields.map((f) => f.id)).size).toBe(2);
  });

  it("keeps ids unique after a removal in the middle", () => {
    const three = addField(addField(addField(EMPTY_CARD, "phone"), "email"), "phone");
    const gapped = removeField(three, three.fields[1].id);
    const grown = addField(gapped, "email");
    expect(new Set(grown.fields.map((f) => f.id)).size).toBe(3);
  });

  it("replaces only the field with a matching id", () => {
    const two = addField(addField(EMPTY_CARD, "phone"), "phone");
    const edited = replaceField(two, { ...two.fields[0], value: "111" } as ContactField);
    expect(edited.fields.map((f) => ("value" in f ? f.value : ""))).toEqual(["111", ""]);
  });

  it("leaves the original card untouched", () => {
    addField(EMPTY_CARD, "phone");
    expect(EMPTY_CARD.fields).toEqual([]);
  });
});

describe("addressText", () => {
  it("joins the parts it has, skipping blanks", () => {
    expect(
      addressText({
        street: "221B Baker Street",
        city: "London",
        region: "",
        postcode: "NW1 6XE",
        country: "United Kingdom",
      }),
    ).toBe("221B Baker Street\nLondon\nNW1 6XE\nUnited Kingdom");
  });
});

describe("addressFromText", () => {
  it("reads a four-line address", () => {
    expect(addressFromText("221B Baker Street\nLondon\nNW1 6XE\nUnited Kingdom")).toEqual({
      street: "221B Baker Street",
      city: "London",
      region: "",
      postcode: "NW1 6XE",
      country: "United Kingdom",
    });
  });

  it("splits on commas too", () => {
    expect(addressFromText("12 High Street, Bath, BA1 1AA").street).toBe("12 High Street");
    expect(addressFromText("12 High Street, Bath, BA1 1AA").postcode).toBe("BA1 1AA");
  });

  it("puts a lone line in the street", () => {
    expect(addressFromText("somewhere").street).toBe("somewhere");
    expect(addressFromText("somewhere").city).toBe("");
  });

  it("keeps extra leading lines in the street", () => {
    const parts = addressFromText("Flat 4\nThe Mill\nLeeds\nLS1 4AB\nUK");
    expect(parts.street).toBe("Flat 4, The Mill");
    expect(parts.city).toBe("Leeds");
  });

  it("round-trips a detailed address back through text", () => {
    const text = "221B Baker Street\nLondon\nNW1 6XE\nUnited Kingdom";
    expect(addressText(addressFromText(text))).toBe(text);
  });
});

describe("encodeVCard", () => {
  const lines = (c: ContactCard) => encodeVCard(c).split("\r\n");

  it("is blank for an empty card, so no code is generated", () => {
    expect(encodeVCard(EMPTY_CARD)).toBe("");
  });

  it("wraps the card in a 3.0 envelope", () => {
    const out = lines(card({ firstName: "Jane", lastName: "Doe" }));
    expect(out[0]).toBe("BEGIN:VCARD");
    expect(out[1]).toBe("VERSION:3.0");
    expect(out.at(-1)).toBe("END:VCARD");
  });

  it("writes the name both structured and displayable", () => {
    const out = lines(card({ firstName: "Jane", lastName: "Doe" }));
    expect(out).toContain("N:Doe;Jane;;;");
    expect(out).toContain("FN:Jane Doe");
  });

  it("omits the name entirely when unnamed", () => {
    const out = lines(card({ fields: [field(1, "phone", { value: "123" })] }));
    expect(out.some((line) => line.startsWith("FN"))).toBe(false);
    expect(out).toContain("TEL;TYPE=CELL:123");
  });

  it("maps phone types onto vCard types", () => {
    const out = lines(
      card({
        fields: [
          field(1, "phone", { type: "work", value: "111" }),
          field(2, "phone", { type: "home", value: "222" }),
        ],
      }),
    );
    expect(out).toContain("TEL;TYPE=WORK:111");
    expect(out).toContain("TEL;TYPE=HOME:222");
  });

  it("keeps repeated fields in order", () => {
    const out = encodeVCard(
      card({
        fields: [
          field(1, "email", { type: "work", value: "a@example.com" }),
          field(2, "email", { type: "home", value: "b@example.com" }),
        ],
      }),
    );
    expect(out.indexOf("a@example.com")).toBeLessThan(out.indexOf("b@example.com"));
  });

  it("writes a website without a type, which vCard 3.0 has no grammar for", () => {
    const out = lines(card({ fields: [field(1, "website", { value: "https://example.com" })] }));
    expect(out).toContain("URL:https://example.com");
  });

  it("skips fields left blank", () => {
    const out = lines(card({ firstName: "Jane", fields: [createField("phone", 1)] }));
    expect(out.some((line) => line.startsWith("TEL"))).toBe(false);
  });

  it("writes a simple address into the street component", () => {
    const out = lines(
      card({
        fields: [
          field(1, "address", { type: "home", address: { detailed: false, text: "12 High St\nBath" } }),
        ],
      }),
    );
    expect(out).toContain("ADR;TYPE=HOME:;;12 High St\\nBath;;;;");
  });

  it("writes a detailed address into its components", () => {
    const out = lines(
      card({
        fields: [
          field(1, "address", {
            type: "work",
            address: {
              detailed: true,
              street: "1 Mill Lane",
              city: "Leeds",
              region: "West Yorkshire",
              postcode: "LS1 4AB",
              country: "UK",
            },
          }),
        ],
      }),
    );
    expect(out).toContain("ADR;TYPE=WORK:;;1 Mill Lane;Leeds;West Yorkshire;LS1 4AB;UK");
  });

  it("escapes the characters that would otherwise end a property", () => {
    const out = lines(card({ fields: [field(1, "note", { value: "a;b,c\\d\ne" })] }));
    expect(out).toContain("NOTE:a\\;b\\,c\\\\d\\ne");
  });

  it("writes organisation and job title", () => {
    const out = lines(
      card({
        fields: [
          field(1, "organisation", { value: "Acme" }),
          field(2, "jobTitle", { value: "Cooper" }),
        ],
      }),
    );
    expect(out).toContain("ORG:Acme");
    expect(out).toContain("TITLE:Cooper");
  });
});
