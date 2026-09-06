import { describe, expect, it } from "vitest";
import { en } from "./en.ts";
import { pl } from "./pl.ts";
import { createMessageFor } from "./catalogue.ts";

describe("catalogues", () => {
  it("cover exactly the same keys", () => {
    expect(Object.keys(pl).sort()).toEqual(Object.keys(en).sort());
  });

  it("has no untranslated Polish strings left as English copies", () => {
    const shared = Object.keys(en).filter(
      (key) => en[key as keyof typeof en] === pl[key as keyof typeof en],
    );
    // Only strings that are genuinely identical in both languages.
    expect(shared.sort()).toEqual(["export.size", "gradient.title", "logo.title", "payload.kind.url"]);
  });
});

describe("createMessageFor", () => {
  it("returns the catalogue string for the locale", () => {
    expect(createMessageFor("en")("check.pass")).toBe("Scans correctly");
    expect(createMessageFor("pl")("check.pass")).toBe("Skanuje się poprawnie");
  });

  it("substitutes named placeholders", () => {
    expect(createMessageFor("en")("hint.low-contrast", { ratio: "1.2", min: 3 })).toContain(
      "only 1.2:1",
    );
  });

  it("leaves a placeholder alone when no value is supplied for it", () => {
    expect(createMessageFor("en")("export.download", {})).toBe("Download {target}");
  });
});
