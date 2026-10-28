import type { Tone } from "@/lib/types";

/** Human label for a skin hex, e.g. "Warm medium". Rough on purpose: it names the chip, shades come from the hex. */
export function toneLabel(hex: string): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const lightness = (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
  const depth = lightness > 0.8 ? "fair" : lightness > 0.68 ? "light" : lightness > 0.52 ? "medium" : lightness > 0.38 ? "tan" : "deep";
  const warmth = r - b;
  const undertone = warmth > 70 ? "Warm" : warmth < 40 ? "Cool" : "Neutral";
  return `${undertone} ${depth}`;
}

type ToneResults = { color: { skin_color: string; lip_color: string; eyebrow_color: string } };

export function toTone(results: ToneResults): Tone {
  const c = results.color;
  return { skinHex: c.skin_color, lipHex: c.lip_color, browHex: c.eyebrow_color, label: toneLabel(c.skin_color) };
}
