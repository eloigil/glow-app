import patterns from "./patterns.json";
import type { MakeupCategory, Step } from "@/lib/types";

// Maps the LLM's simplified Step onto YouCam's per-category effect schema.
// Docs: https://docs.perfectcorp.com/reference/description/ai_makeup_vto.md

type PatternEntry = { id: string; colors: number; look: string };
export const PATTERNS = patterns as unknown as Partial<Record<MakeupCategory, PatternEntry[]>>;

/** Categories that need no pattern from the catalog. */
export const UNPATTERNED: MakeupCategory[] = ["foundation", "concealer", "lip_color"];

export function patternFor(step: Step): PatternEntry | undefined {
  return PATTERNS[step.category]?.find((p) => p.id === step.pattern);
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
const SHIMMER = "#FFF4F7";

/** One palette per pattern color slot, padding with the last color the LLM gave. */
function colorsFor(step: Step, count: number) {
  return Array.from({ length: count }, (_, i) => step.colors[i] ?? step.colors[step.colors.length - 1] ?? "#C98B8B");
}

function eyeTexture(step: Step) {
  return step.finish === "shimmer" || step.finish === "satin"
    ? { texture: "shimmer", shimmerColor: SHIMMER, shimmerIntensity: step.finish === "satin" ? 25 : 50 }
    : { texture: "matte" };
}

function lipTexture(step: Step) {
  switch (step.finish) {
    case "gloss":
      return { texture: "gloss", gloss: 60, transparencyIntensity: 30 };
    case "sheer":
      return { texture: "sheer", gloss: 30, transparencyIntensity: 55 };
    case "shimmer":
      return { texture: "shimmer", gloss: 40, transparencyIntensity: 20, shimmerColor: SHIMMER, shimmerIntensity: 40, shimmerDensity: 40, shimmerSize: 30 };
    case "satin":
      return { texture: "satin" };
    default:
      return { texture: "matte" };
  }
}

function blushTexture(step: Step) {
  if (step.finish === "satin" || step.finish === "gloss") return { texture: "satin", glowStrength: 50 };
  if (step.finish === "shimmer") return { texture: "shimmer", shimmerColor: SHIMMER, shimmerDensity: 40 };
  return { texture: "matte" };
}

export function toEffect(step: Step): Record<string, unknown> {
  const colorIntensity = clamp(step.intensity);
  const n = patternFor(step)?.colors ?? 1;
  const pattern = { name: step.pattern };
  switch (step.category) {
    case "foundation":
      return { category: "foundation", palettes: [{ color: step.colors[0], colorIntensity, glowIntensity: step.finish === "matte" ? 10 : 45, coverageIntensity: 55 }] };
    case "concealer":
      return { category: "concealer", palettes: [{ color: step.colors[0], colorIntensity, colorUnderEyeIntensity: 55, coverageLevel: 65 }] };
    case "blush":
      return { category: "blush", pattern, palettes: colorsFor(step, n).map((color) => ({ color, colorIntensity, ...blushTexture(step) })) };
    case "contour":
    case "bronzer":
    case "eyelashes":
      return { category: step.category, pattern, palettes: colorsFor(step, n).map((color) => ({ color, colorIntensity })) };
    case "highlighter":
      return { category: "highlighter", pattern, palettes: [{ color: step.colors[0], colorIntensity, glowIntensity: 60, shimmerIntensity: 40, shimmerDensity: 40, shimmerSize: 30 }] };
    case "eyebrows":
      return {
        category: "eyebrows",
        pattern: { type: "shape", name: step.pattern, curvature: 0, thickness: 0, definition: 50 },
        palettes: [{ color: step.colors[0], colorIntensity, texture: "matte" }],
      };
    case "eye_shadow":
    case "eye_liner":
      return { category: step.category, pattern, palettes: colorsFor(step, n).map((color) => ({ color, colorIntensity, ...eyeTexture(step) })) };
    case "lip_color":
      return { category: "lip_color", shape: { name: "original" }, style: { type: "full" }, palettes: [{ color: step.colors[0], colorIntensity, ...lipTexture(step) }] };
  }
}

/** Light, constant smoothing so each step shows the makeup, not a beauty filter. */
export const SKIN_SMOOTH = { category: "skin_smooth", skinSmoothStrength: 15, skinSmoothColorIntensity: 0 };

export function toEffects(steps: Step[]) {
  return [SKIN_SMOOTH, ...steps.map(toEffect)];
}
