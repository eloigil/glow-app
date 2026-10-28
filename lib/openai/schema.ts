import { z } from "zod";

// spec.md > Looks Route: the strict JSON shape OpenAI must return.
// Structured Outputs needs every field required, so "absent" is expressed as null.

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const CATEGORIES = [
  "foundation", "concealer", "contour", "bronzer", "blush", "highlighter",
  "eyebrows", "eye_shadow", "eye_liner", "eyelashes", "lip_color",
] as const;
export const FINISHES = ["matte", "satin", "shimmer", "gloss", "sheer"] as const;
export const CONCERN_KEYS = ["acne", "redness", "dark_circle_v2", "age_spot", "oiliness", "eye_bag"] as const;

export const StepSchema = z.object({
  title: z.string().describe('Short step name with product type and shade, e.g. "Concealer, warm beige"'),
  category: z.enum(CATEGORIES),
  pattern: z.string().nullable().describe("Pattern id from the allowed list for this category; null for foundation, concealer, lip_color"),
  colors: z.array(hex).min(1).max(3).describe("One hex color per color slot of the pattern"),
  intensity: z.number().int().min(10).max(90),
  finish: z.enum(FINISHES),
  tip: z.string().describe("Two or three sentences of practical technique for her face today, second person"),
  corrects: z.array(z.enum(CONCERN_KEYS)).max(3)
    .describe("Today's points this step fixes; empty for color steps"),
});

export const LookSchema = z.object({
  name: z.string().describe("Two or three evocative words"),
  description: z.string().describe("One sentence, under 20 words, what the look is and how long it takes"),
  difficulty: z.number().int().min(1).max(3).describe("1 easy, 2 medium, 3 difficult"),
  minutes: z.number().int().min(3).max(45),
  steps: z.array(StepSchema).min(3).max(8),
});

export const LookPlanSchema = z.object({ looks: z.array(LookSchema).length(5) });

export type LookPlan = z.infer<typeof LookPlanSchema>;
