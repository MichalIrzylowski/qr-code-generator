# QR Code Generator

A browser-only tool for designing and exporting static, styled QR codes. It exists because the
comparable hosted tools gate exports behind an email address; this one asks for nothing and sends
nothing anywhere.

## Language

### The code itself

**Payload**:
The data a QR code encodes, as a tagged variant (`url` today; `text`, `wifi`, `vcard` later).
The variant determines which input form is shown and how the raw encoded string is built.
_Avoid_: content, value, data

**Design**:
The complete set of visual choices applied to a Payload — dot style, corner styles, colours or
gradient, margin, background, Logo Overlay and error correction. A Design is serialisable and is what
gets persisted and shared.
_Avoid_: config, settings, options, style

**Preset**:
A named, ready-made Design shipped with the app, used as a starting point. Selecting one replaces
the visual choices but keeps the current Logo Overlay, which the user supplied and a Preset has no
opinion about; editing afterwards does not modify the Preset.
_Avoid_: template, theme

**Logo Overlay**:
A user-supplied image placed at the centre of a QR code, always sourced from the local machine
(file pick or clipboard paste) and held as a data URI. Its presence forces the error correction
level upward and caps its own size.
_Avoid_: image, icon, watermark, branding

### Producing output

**Export**:
The act of turning the current Design into a downloadable file, and the file itself. Every Export
is produced in the browser; nothing is uploaded.
_Avoid_: download, render, save

**Export Target**:
One supported output format — PNG, JPEG, SVG or PDF. Targets differ in capability, and those
differences are surfaced rather than hidden: JPEG cannot carry a transparent background, and PDF
is written as vector rather than an embedded raster.
_Avoid_: file type, format

### Trusting the result

**Scannability Check**:
An automatic verification that the rendered Design can actually be decoded, performed by scanning
the generated image back with a decoder and reporting a pass or fail. It is a measurement, not an
estimate.
_Avoid_: validation, preview check, quality score

**Scannability Hint**:
A human-readable explanation of *why* a Scannability Check failed or is at risk — insufficient
contrast, oversized Logo Overlay, excessive Payload length. Hints are heuristic; the Check is not.
_Avoid_: warning, error

**Enforcement**:
The app's refusal to let a Design reach a state that is known-unscannable — chiefly by raising the
error correction level while a Logo Overlay is present and capping that overlay's size. Advanced
controls widen what is reachable; they do not disable Enforcement.
_Avoid_: guardrails, constraints
