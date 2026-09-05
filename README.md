# QR Code Generator

Design and export styled QR codes entirely in the browser. No account, no upload, no email.

The privacy claim is architectural rather than a promise: the app is a static bundle with no API
routes, no database and no analytics, so there is nowhere for a payload to be sent even in
principle. See [ADR-0001](docs/adr/0001-client-only-no-backend.md).

## What it does

- **URL payloads** today, with the model shaped so WiFi, vCard and plain text can follow.
- **Styling**: dot and corner styles, foreground and background colours, an optional gradient,
  quiet zone, and a logo — with corner styling linked to the body by default and unlockable when
  you want it separate.
- **Enforcement**: a logo forces error correction to level H and is size-capped, so the app has no
  path to a design that is knowingly unscannable.
- **A measured Scannability Check**: the rendered code is decoded back with a real scanner and
  reported as pass or fail. Hints explain *why* when it fails.
- **Exports**: PNG, JPEG, SVG, and a vector PDF ([ADR-0002](docs/adr/0002-vector-pdf-export.md)).
  The pixel-size selector applies to the raster formats only; SVG and PDF are resolution-free, and
  a PDF is written at a fixed 2" square. JPEG has no alpha channel, so a transparent design is
  flattened onto white and says so.
- **Persistence**: your last design is kept in `localStorage`, and a share link encodes the design
  into the URL. The link deliberately omits the logo, which stays on your machine. A share link is
  untrusted input, so every field is validated on the way back in.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # domain tests
npm run typecheck
npm run build
```

## Deploying

Push to a repo and import it on Vercel; `vercel.json` sets the framework, output directory and a
CSP that keeps the app locked to its own origin. There is nothing to configure — no environment
variables, no secrets.

## Layout

| Path | What lives there |
| --- | --- |
| `src/domain/` | Pure, tested domain logic — Payload, Design, Enforcement, hints, share codec |
| `src/lib/` | Browser-only edges — rendering, rasterising, exports, the Scannability Check |
| `src/hooks/` | State, persistence, and the `qr-code-styling` instance |
| `src/components/` | UI |
| `CONTEXT.md` | The glossary. Read it before naming anything |
