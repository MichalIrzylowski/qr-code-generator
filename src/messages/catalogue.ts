import type { Locale } from "@/domain/locale.ts";
import { en, type MessageKey } from "./en.ts";
import { pl } from "./pl.ts";

const CATALOGUES: Record<Locale, Record<MessageKey, string>> = { en, pl };

/** Values substituted into `{name}` placeholders. No plural rules: see CONTEXT.md. */
export type MessageValues = Record<string, string | number>;

/** Looks up one Message. Named for what it does so callers read as English. */
export type MessageFor = (key: MessageKey, values?: MessageValues) => string;

/**
 * Bind the Messages for a Locale. Pure, and kept apart from the module that
 * reads `navigator`, so the catalogues can be exercised without a DOM.
 *
 * There is deliberately no fallback to English for a missing key: the catalogue
 * type makes one impossible, and a runtime fallback would only weaken the
 * guarantee the typecheck already gives.
 */
export const createMessageFor =
  (locale: Locale): MessageFor =>
  (key, values) => {
    const template = CATALOGUES[locale][key];
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
