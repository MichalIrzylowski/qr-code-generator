import { DEFAULT_DESIGN, type Design } from "./design.ts";

/**
 * A Preset is a named, ready-made Design used as a starting point. It replaces
 * the Design and nothing else: it has no opinion about anything the user
 * supplied, which today means neither the Logo Overlay nor the Caption.
 */
export type PresetId = "classic" | "rounded" | "dots" | "classy" | "punch";

export type Preset = { id: PresetId; design: Design };

export const PRESETS: Preset[] = [
  {
    id: "classic",
    design: { ...DEFAULT_DESIGN, dotStyle: "square", foreground: "#000000" },
  },
  {
    id: "rounded",
    design: { ...DEFAULT_DESIGN },
  },
  {
    id: "dots",
    design: { ...DEFAULT_DESIGN, dotStyle: "dots", foreground: "#1d4ed8" },
  },
  {
    id: "classy",
    design: { ...DEFAULT_DESIGN, dotStyle: "classy-rounded", foreground: "#0f766e" },
  },
  {
    id: "punch",
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
