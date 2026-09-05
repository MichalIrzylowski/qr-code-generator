import { DEFAULT_DESIGN, type Design } from "./design.ts";

/** A Preset is a named, ready-made Design used as a starting point. */
export type Preset = { id: string; name: string; design: Design };

export const PRESETS: Preset[] = [
  {
    id: "classic",
    name: "Classic",
    design: { ...DEFAULT_DESIGN, dotStyle: "square", foreground: "#000000" },
  },
  {
    id: "rounded",
    name: "Rounded",
    design: { ...DEFAULT_DESIGN },
  },
  {
    id: "dots",
    name: "Dots",
    design: { ...DEFAULT_DESIGN, dotStyle: "dots", foreground: "#1d4ed8" },
  },
  {
    id: "classy",
    name: "Classy",
    design: { ...DEFAULT_DESIGN, dotStyle: "classy-rounded", foreground: "#0f766e" },
  },
  {
    id: "punch",
    name: "Punch",
    design: {
      ...DEFAULT_DESIGN,
      dotStyle: "extra-rounded",
      foreground: "#be123c",
      background: "#fff1f2",
      corners: {
        linked: false,
        squareStyle: "extra-rounded",
        squareColor: "#111827",
        dotStyle: "dot",
        dotColor: "#be123c",
      },
    },
  },
];
