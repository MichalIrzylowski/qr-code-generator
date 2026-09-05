import { describe, expect, it } from "vitest";
import { resolveLocale } from "./locale.ts";

describe("resolveLocale", () => {
  it("takes the first supported language in preference order", () => {
    expect(resolveLocale(["pl-PL", "en-US"])).toBe("pl");
    expect(resolveLocale(["en-GB", "pl-PL"])).toBe("en");
  });

  it("matches on the primary subtag only", () => {
    expect(resolveLocale(["pl"])).toBe("pl");
    expect(resolveLocale(["PL-pl"])).toBe("pl");
  });

  it("skips unsupported languages rather than giving up at the first one", () => {
    expect(resolveLocale(["de-DE", "fr", "pl-PL"])).toBe("pl");
  });

  it("falls back to English when nothing is supported or the list is empty", () => {
    expect(resolveLocale(["de-DE", "fr"])).toBe("en");
    expect(resolveLocale([])).toBe("en");
  });

  it("lets an override win over detection", () => {
    expect(resolveLocale(["en-US"], "pl")).toBe("pl");
    expect(resolveLocale(["pl-PL"], "en")).toBe("en");
  });

  it("ignores an override that is not a supported locale", () => {
    expect(resolveLocale(["pl-PL"], "de")).toBe("pl");
    expect(resolveLocale(["pl-PL"], "")).toBe("pl");
    expect(resolveLocale(["pl-PL"], null)).toBe("pl");
  });
});
