# QR Code Generator

A browser-only tool for designing and exporting static, styled QR codes. It exists because the
comparable hosted tools gate exports behind an email address; this one asks for nothing and sends
nothing anywhere.

## Language

### The code itself

**Payload**:
The data a QR code encodes, as a tagged variant — Link, Text and Contact card today; `wifi` and
friends later. Which variant a code carries is the user's first and most visible choice, not a
setting tucked away inside one. A variant owns its own answers to what it means for it to be empty,
what an Export of it is called and whether it may travel in a share link: those answers genuinely
differ between a public address and a person's details, rather than being one rule with exceptions.
_Avoid_: content, value, data

**Contact card**:
The Payload variant that encodes a person: a Name plus any number of added Fields. It is always
spoken of as a Contact card — never as vCard, which is the encoding it happens to be written in
(ADR-0004) and a word no user should have to meet. A Contact card is structured rather than a single
string: it is empty when the Name and every one of its Fields is blank, and a card with no Name
still encodes,
though most phones will refuse to save it, so the app says so as a Scannability Hint rather than
blocking the export.
_Avoid_: vcard, MECARD, contact, business card, person

**Field**:
One line of a Contact card — a phone number, an email address, a website, an organisation, a job
title, an address or a note. Fields are *added*, not filled in: only the Name is present at rest,
and everything else arrives through one gesture that also removes it. Phone, email, website and
address are repeatable, so two numbers is the same concept as one; the rest appear once. A
repeatable Field carries a type (Mobile, Work, Home) so that two of the same kind stay tellable
apart in the contact the scanner saves.
_Avoid_: row, entry, property, attribute

**Design**:
The complete set of visual choices applied to a Payload — dot style, corner styles, colours or
gradient, margin, background, Logo Overlay and error correction. A Design is serialisable and is what
gets persisted and shared.
_Avoid_: config, settings, options, style

**Preset**:
A named, ready-made Design shipped with the app, used as a starting point. Selecting one replaces
the visual choices and nothing else: a Preset has no opinion about anything the user supplied, which
today means it leaves both the Logo Overlay and the Caption untouched. Editing afterwards does not
modify the Preset.
_Avoid_: template, theme

**Caption**:
Optional human-readable text placed beneath the code. It is neither Payload nor Design: a scanner
never reads it and a human always does, so it is the only part of the artefact that carries meaning
outside the code. A Caption is capped in length, wrapped to at most two lines at the code's width and
ellipsised beyond that, so the artefact's shape never depends on how much was typed. Its glyphs are
emitted as vector paths rather than SVG text (ADR-0003). A blank Caption is not an empty band but no
band at all, and the export stays byte-identical to one made before Captions existed.
_Avoid_: label, title, subtitle, alt text

**Artefact**:
The composed thing a user actually receives: the code, plus the Caption beneath it when there is one.
Square without a Caption and taller than it is wide with one, never wider — the export size selector
always names the *code's* width, so adding a Caption can never shrink the thing being scanned. One
Artefact feeds the preview, every Export Target and the Scannability Check alike.
_Avoid_: output, image, canvas

**Logo Overlay**:
A user-supplied image placed at the centre of a QR code, always sourced from the local machine
(file pick or clipboard paste) and held as a data URI. Its presence forces the error correction
level upward and caps its own size.
_Avoid_: image, icon, watermark, branding

### Speaking the user's language

**Locale**:
The language the UI is written in — English or Polish today. A Locale is a property of the *viewer*,
not of a Design: it is detected from the browser once at startup and never becomes state, so there is
no switcher, nothing persisted, and a share link carries no language. Opening someone else's link
shows the copy you read, not the copy they wrote it in. A `?lang=` query parameter overrides
detection, undocumented in the UI and there only so the Polish copy can be reviewed.
_Avoid_: language setting, i18n, translation

**Message**:
One piece of UI copy, addressed by a flat dotted key. English is the source of truth for which keys
exist, so a missing Polish string fails the typecheck rather than surfacing as a blank label. Values
are substituted into `{name}` placeholders; there are deliberately no plural rules, so a string
needing them is phrased around instead ("Characters: 120") until a second case earns the machinery.
_Avoid_: string, label, copy, translation

### Producing output

**Export**:
The act of turning the current Design into a downloadable file, and the file itself. Every Export
is produced in the browser; nothing is uploaded. Its filename is derived from what the code means
rather than what it encodes — a Link's host and path, a Contact card's Name — falling back to a
neutral name when there is nothing to derive from.
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
estimate. The Artefact is rendered whole and the code's square is what gets decoded: a Caption never
reaches the quiet zone, so it cannot affect decoding, but its pixels do defeat `jsQR`'s locator and
would otherwise fail codes that scan.
_Avoid_: validation, preview check, quality score

**Scannability Hint**:
A human-readable explanation of *why* a Scannability Check failed or is at risk — insufficient
contrast, oversized Logo Overlay, excessive Payload length. Hints are heuristic; the Check is not.
A Hint never gates anything: the app's standing position is that a QR code of a mistake is still a
valid QR code, so even a Contact card with no Name encodes and exports.
_Avoid_: warning, error

**Enforcement**:
The app's refusal to let a Design reach a state that is known-unscannable — chiefly by raising the
error correction level while a Logo Overlay is present and capping that overlay's size. Advanced
controls widen what is reachable; they do not disable Enforcement.
_Avoid_: guardrails, constraints
