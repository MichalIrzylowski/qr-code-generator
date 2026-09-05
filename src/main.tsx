import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { LOCALE, msg } from "./messages/index.ts";
import "./index.css";

// index.html ships an English title as the pre-hydration default; correct it
// once the Locale is known. `lang` matters for screen readers and hyphenation.
document.documentElement.lang = LOCALE;
document.title = msg("app.title");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
