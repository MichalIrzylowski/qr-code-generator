import { resolveLocale, type Locale } from "@/domain/locale.ts";
import { createMessageFor, type MessageFor } from "./catalogue.ts";

export type { MessageKey } from "./en.ts";
export type { MessageFor, MessageValues } from "./catalogue.ts";
export { createMessageFor } from "./catalogue.ts";

const LOCALE_PARAM = "lang";

/**
 * The Locale for this session, decided once at startup. There is no switcher
 * and no persistence — the browser already carries the user's answer, so the
 * only thing state would add is a way for it to be wrong.
 */
export const LOCALE: Locale = resolveLocale(
  navigator.languages ?? [navigator.language],
  new URLSearchParams(window.location.search).get(LOCALE_PARAM),
);

export const msg: MessageFor = createMessageFor(LOCALE);
