# PDF Exports are vector, not an embedded raster

`qr-code-styling` emits PNG, JPEG, WEBP and SVG but not PDF, so a PDF Export Target has to be built
on top. We generate SVG and convert it with `jspdf` + `svg2pdf.js` rather than taking the simpler
route of wrapping a rendered PNG in a PDF page. PDF is only requested here for print and handoff, and
a raster PDF is strictly worse at both than the PNG we already offer — it would be a format that
exists only to disappoint. The two libraries are loaded lazily so their weight lands only when
someone actually exports a PDF.
