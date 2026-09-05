import type { MessageKey } from "./en.ts";

/**
 * Typed against `MessageKey`, so dropping or misspelling a key fails the build
 * rather than falling back to English at runtime.
 */
export const pl: Record<MessageKey, string> = {
  "app.title": "Generator kodów QR",
  "app.tagline":
    "Wszystko dzieje się w tej karcie. Bez konta, bez wysyłania, bez adresu e-mail — twoje linki nie opuszczają przeglądarki.",

  "payload.title": "Treść",
  "payload.hint": "To, co koduje kod QR.",
  "payload.url.label": "Adres URL",
  "payload.url.placeholder": "przyklad.pl",
  "payload.issue.malformed-url":
    "To nie wygląda na poprawny adres URL, ale kod i tak go zakoduje.",

  "caption.title": "Podpis",
  "caption.hint": "Opcjonalny tekst pod kodem. Skanery go ignorują, ludzie nie.",
  "caption.text.label": "Tekst",
  "caption.text.placeholder": "Zeskanuj, by zobaczyć menu",
  "caption.text.remaining": "Pozostało znaków: {remaining}.",
  "caption.color.label": "Kolor",
  "caption.size.label": "Rozmiar",
  "caption.size.small": "Mały",
  "caption.size.medium": "Średni",
  "caption.size.large": "Duży",
  "caption.font.error":
    "Nie udało się wczytać czcionki podpisu, więc podpisu nie ma na kodzie. Sprawdź połączenie i odśwież stronę.",

  "preset.title": "Style gotowe",
  "preset.hint": "Punkt wyjścia. Późniejsze zmiany nie modyfikują stylu gotowego.",
  "preset.classic": "Klasyczny",
  "preset.rounded": "Zaokrąglony",
  "preset.dots": "Kropki",
  "preset.classy": "Elegancki",
  "preset.punch": "Wyrazisty",

  "style.title": "Wygląd",
  "style.dotStyle.label": "Kształt modułów",
  "style.foreground.label": "Kolor kodu",
  "style.background.label": "Tło",
  "style.transparent.label": "Przezroczyste tło",
  "style.margin.label": "Margines ochronny",

  "dot.square": "Kwadrat",
  "dot.dots": "Kropki",
  "dot.rounded": "Zaokrąglony",
  "dot.extra-rounded": "Mocno zaokrąglony",
  "dot.classy": "Elegancki",
  "dot.classy-rounded": "Elegancki zaokrąglony",

  "corners.title": "Narożniki",
  "corners.unlink.label": "Osobny styl narożników",
  "corners.square.label": "Ramka narożnika",
  "corners.squareColor.label": "Kolor ramki narożnika",
  "corners.dot.label": "Środek narożnika",
  "corners.dotColor.label": "Kolor środka narożnika",
  "corners.style.square": "Kwadrat",
  "corners.style.dot": "Kropka",
  "corners.style.extra-rounded": "Mocno zaokrąglony",

  "logo.title": "Logo",
  "logo.hint": "Wczytywane tylko z twojego urządzenia — nic nie jest wysyłane.",
  "logo.drop": "Upuść lub wklej tutaj obraz albo",
  "logo.choose": "wybierz plik",
  "logo.remove": "Usuń",
  "logo.size.label": "Rozmiar logo",
  "logo.size.hint": "Ograniczony do {percent}%, żeby kod nadal się skanował.",
  "logo.padding.label": "Odstęp wokół logo",
  "logo.hideDots.label": "Usuń moduły pod logo",
  "logo.error.type": "Użyj obrazu PNG, JPEG, SVG lub WebP.",
  "logo.error.size": "Ten obraz waży ponad 2 MB. Wybierz mniejszy.",
  "logo.error.read": "Nie udało się odczytać tego pliku.",

  "gradient.title": "Gradient",
  "gradient.enable.label": "Użyj gradientu zamiast jednolitego koloru",
  "gradient.type.label": "Rodzaj gradientu",
  "gradient.type.linear": "Liniowy",
  "gradient.type.radial": "Promienisty",
  "gradient.from.label": "Od",
  "gradient.to.label": "Do",
  "gradient.angle.label": "Kąt",
  "gradient.note": "Kontrast liczony jest względem pierwszego koloru, więc niech ten koniec będzie ciemny.",

  "advanced.title": "Zaawansowane",
  "ec.label": "Korekcja błędów",
  "ec.hint.enforced":
    "Utrzymana na poziomie H, dopóki jest logo — logo zasłania moduły, które zastępują dane naprawcze.",
  "ec.hint.free": "Wyższa korekcja przetrwa uszkodzenia, ale zagęszcza kod.",
  "ec.L": "L — 7% odzysku",
  "ec.M": "M — 15% odzysku",
  "ec.Q": "Q — 25% odzysku",
  "ec.H": "H — 30% odzysku",

  "preview.empty": "Wpisz adres URL, żeby zobaczyć kod.",
  "preview.decoded": "Odczytano: {decoded}",
  "check.pass": "Skanuje się poprawnie",
  "check.checking": "Sprawdzanie…",
  "check.fail": "Nie skanuje się",
  "check.mismatch": "Skanuje się, ale odczytuje coś innego",

  "hint.low-contrast":
    "Kontrast między kodem a tłem wynosi tylko {ratio}:1. Celuj w co najmniej {min}:1.",
  "hint.inverted":
    "Kod jest jaśniejszy niż tło. Wiele skanerów zakłada ciemny wzór na jasnym tle i odmówi odczytu.",
  "hint.long-payload":
    "Liczba znaków: {length}. To gęsty kod, który wymaga pewnej ręki i dobrego aparatu.",

  "export.title": "Eksport",
  "export.size": "{size} px",
  "export.flattening": "JPEG nie obsługuje przezroczystości — eksport zostanie spłaszczony na biało.",
  "export.download": "Pobierz {target}",
  "export.working": "Pracuję…",
  "export.failed": "Eksport nie powiódł się.",
  "share.copy": "Kopiuj link",
  "share.copied": "Skopiowano",
  "share.title": "Skopiuj link, który otworzy ten projekt ponownie",
  "share.prompt": "Skopiuj ten link:",
  "share.omitsLogo": "Link niesie projekt, ale nie logo — ono zostaje na twoim urządzeniu.",

  "a11y.colorPicker": "Wybór koloru",
};
