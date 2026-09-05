# Captions render as vector paths, never as SVG text

A Caption is drawn by converting its glyphs to path outlines with `opentype.js` and emitting a
single `<path>`. It is never an SVG `<text>` element, and the composed artefact references no font
by name.

The forcing constraint is the PDF Export Target. PDF goes through `jspdf` + `svg2pdf.js` (ADR-0002),
and jsPDF's fourteen built-in fonts are encoded as WinAnsi, which has no code points for `ą ć ę ł ń
ś ź ż`. A Polish caption written as text would come out blank or mojibake in the one target that
exists for print — silently, since nothing throws. Embedding a Unicode font would fix PDF but leave
standalone SVG exports still reflowing on machines that lack the font, so the font problem would
have to be solved twice, in two embedding formats, and verified in four targets.

Paths are paths everywhere: the browser preview, the raster targets, a bare SVG opened on a stranger's
machine, and the PDF all lay out identically, and the Scannability Check measures exactly what gets
exported. The costs are accepted deliberately: caption text is not selectable or searchable in the
SVG and PDF, and a ~22KB subsetted Inter Regular (`public/fonts/inter-caption.ttf`, Latin plus Latin
Extended-A) must load before a caption can be drawn. That font is fetched lazily — only once a
Caption is actually non-empty — and while it is missing the code renders without the caption and
export is disabled, so a failed load can never become a download that silently lacks the text the
user typed.

Consequences for future work: any new Export Target inherits correct captions for free, and any new
caption styling (a second font, a weight picker) costs another font file to ship and subset. The
`opentype.js` measurement used for line-breaking is the same one used for drawing, deliberately — two
measurers would disagree, and the disagreement would surface only in the PDF.
