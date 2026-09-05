/**
 * The English catalogue is the source of truth for what keys exist: `MessageKey`
 * is derived from it, so a missing Polish string is a typecheck failure rather
 * than a blank label someone notices in production.
 *
 * Keys are dotted for readability but the object is flat — nesting would defeat
 * the exhaustiveness check that is the whole reason for hand-rolling this.
 */
export const en = {
  "app.title": "QR Code Generator",
  "app.tagline":
    "Everything happens in this tab. No account, no upload, no email — your links never leave your browser.",

  "payload.title": "Payload",
  "payload.hint": "What the code encodes.",
  "payload.url.label": "URL",
  "payload.url.placeholder": "example.com",
  "payload.issue.malformed-url": "That doesn't look like a valid URL, but the code will still encode it.",

  "caption.title": "Caption",
  "caption.hint": "Optional text printed under the code. Scanners ignore it; people don't.",
  "caption.text.label": "Text",
  "caption.text.placeholder": "Scan for the menu",
  "caption.text.remaining": "{remaining} characters left.",
  "caption.color.label": "Colour",
  "caption.size.label": "Size",
  "caption.size.small": "Small",
  "caption.size.medium": "Medium",
  "caption.size.large": "Large",
  "caption.font.error": "Couldn't load the caption font, so the caption is missing from the code. Check your connection and reload.",

  "preset.title": "Presets",
  "preset.hint": "A starting point. Editing afterwards won't change the preset.",
  "preset.classic": "Classic",
  "preset.rounded": "Rounded",
  "preset.dots": "Dots",
  "preset.classy": "Classy",
  "preset.punch": "Punch",

  "style.title": "Style",
  "style.dotStyle.label": "Dot style",
  "style.foreground.label": "Foreground",
  "style.background.label": "Background",
  "style.transparent.label": "Transparent background",
  "style.margin.label": "Quiet zone",

  "dot.square": "Square",
  "dot.dots": "Dots",
  "dot.rounded": "Rounded",
  "dot.extra-rounded": "Extra rounded",
  "dot.classy": "Classy",
  "dot.classy-rounded": "Classy rounded",

  "corners.title": "Corners",
  "corners.unlink.label": "Style corners separately",
  "corners.square.label": "Corner frame",
  "corners.squareColor.label": "Corner frame colour",
  "corners.dot.label": "Corner centre",
  "corners.dotColor.label": "Corner centre colour",
  "corners.style.square": "Square",
  "corners.style.dot": "Dot",
  "corners.style.extra-rounded": "Extra rounded",

  "logo.title": "Logo",
  "logo.hint": "Read from your machine only — nothing is uploaded.",
  "logo.drop": "Drop or paste an image here, or",
  "logo.choose": "choose a file",
  "logo.remove": "Remove",
  "logo.size.label": "Logo size",
  "logo.size.hint": "Capped at {percent}% so the code still scans.",
  "logo.padding.label": "Logo padding",
  "logo.hideDots.label": "Clear dots behind the logo",
  "logo.error.type": "Use a PNG, JPEG, SVG or WebP image.",
  "logo.error.size": "That image is over 2 MB. Try a smaller one.",
  "logo.error.read": "Could not read that file.",

  "gradient.title": "Gradient",
  "gradient.enable.label": "Use a gradient instead of a flat colour",
  "gradient.type.label": "Gradient type",
  "gradient.type.linear": "Linear",
  "gradient.type.radial": "Radial",
  "gradient.from.label": "From",
  "gradient.to.label": "To",
  "gradient.angle.label": "Angle",
  "gradient.note": "Contrast is judged against the first colour, so keep that end dark.",

  "advanced.title": "Advanced",
  "ec.label": "Error correction",
  "ec.hint.enforced": "Held at H while a logo is present — the logo covers modules that recovery data replaces.",
  "ec.hint.free": "Higher recovery survives damage but makes a denser code.",
  "ec.L": "L — 7% recovery",
  "ec.M": "M — 15% recovery",
  "ec.Q": "Q — 25% recovery",
  "ec.H": "H — 30% recovery",

  "preview.empty": "Enter a URL to see your code.",
  "preview.decoded": "Decoded: {decoded}",
  "check.pass": "Scans correctly",
  "check.checking": "Checking…",
  "check.fail": "Does not scan",
  "check.mismatch": "Scans, but decodes to the wrong thing",

  "hint.low-contrast":
    "Contrast between the code and its background is only {ratio}:1. Aim for at least {min}:1.",
  "hint.inverted":
    "The code is lighter than its background. Many scanners assume dark-on-light and will refuse to read this.",
  "hint.long-payload":
    "{length} characters makes for a dense code that needs a steady hand and a good camera.",

  "export.title": "Export",
  "export.size": "{size} px",
  "export.flattening": "JPEG has no transparency — this export will be flattened onto white.",
  "export.download": "Download {target}",
  "export.working": "Working…",
  "export.failed": "Export failed.",
  "share.copy": "Copy share link",
  "share.copied": "Copied",
  "share.title": "Copy a link that reopens this design",
  "share.prompt": "Copy this link:",
  "share.omitsLogo": "The share link carries the design but not the logo — that stays on your machine.",

  "a11y.colorPicker": "Colour picker",
} as const;

export type MessageKey = keyof typeof en;
