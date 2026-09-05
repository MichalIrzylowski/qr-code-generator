/**
 * A Locale is the language the UI speaks. It is a property of the viewer, not
 * of a Design: it is detected once at startup and never becomes state, so a
 * share link carries no language and opening someone else's link shows the copy
 * *you* read rather than the copy *they* wrote it in.
 */
export type Locale = "en" | "pl";

export const LOCALES: readonly Locale[] = ["en", "pl"];
export const DEFAULT_LOCALE: Locale = "en";

const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** The primary subtag of a BCP 47 tag: `pl-PL` and `pl` both yield `pl`. */
const primarySubtag = (tag: string): string => tag.toLowerCase().split("-")[0];

/**
 * Resolve the Locale to use.
 *
 * `languages` is walked in preference order and the *first* supported entry
 * wins — someone whose list reads `["en-GB", "pl-PL"]` prefers English and gets
 * it. Anything unsupported falls through to English.
 *
 * `override` exists so the Polish copy can be reviewed without changing OS
 * settings. It is deliberately undocumented in the UI: there is no language
 * switcher, because the browser already knows the answer.
 */
export const resolveLocale = (
  languages: readonly string[],
  override?: string | null,
): Locale => {
  if (override != null && isLocale(override.toLowerCase())) {
    return override.toLowerCase() as Locale;
  }

  for (const tag of languages) {
    const primary = primarySubtag(tag);
    if (isLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
};
