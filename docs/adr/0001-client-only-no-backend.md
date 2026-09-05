# Everything runs in the browser; there is no backend

Payloads are often private (internal URLs, and later WiFi credentials and contact details), and the
tool's reason for existing is that the hosted alternatives demand an email address before letting you
export. Encoding, styling, the Scannability Check and every Export therefore happen client-side, and
the app deploys to Vercel as a static bundle with no API routes, no database, no accounts and no
analytics — so "your data never leaves your browser" is a fact about the architecture rather than a
promise about our conduct.

## Consequences

- **Dynamic QR codes are out of scope.** A re-pointable short link needs a server, a datastore and an
  identity to own the link. Offering it would dismantle the guarantee above; it would be a different
  product, not a feature of this one.
- Persistence is `localStorage` (per-device, includes the Logo Overlay) plus a shareable URL that
  encodes the Design. The URL deliberately omits the Logo Overlay, whose data URI would exceed
  practical URL length limits.
- Logo Overlays are never fetched from a remote URL: local file pick and clipboard paste only. A
  remote fetch would be the single network request in the app, and would fail unpredictably on CORS.
