import { z } from "zod";

// spec.md > Looks Route: the strict JSON shape OpenAI must return.
// Structured Outputs needs every field required, so "absent" is expressed as null.

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const StepSchema = z.object({
  title: z.string().describe('Short step name with product type and shade, e.g. "Concealer, warm beige"'),
  category: z.enum([
    "foundation", "concealer", "contour", "bronzer", "blush", "highlighter",
    "eyebrows", "eye_shadow", "eye_liner", "eyelashes", "lip_color",
  ]),
  pattern: z.string().nullable().describe("Pattern id from the allowed list for this category; null for foundation, concealer, lip_color"),
  colors: z.array(hex).min(1).max(3).describe("One hex color per color slot of the pattern"),
  intensity: z.number().int().min(10).max(90),
  finish: z.enum(["matte", "satin", "shimmer", "gloss", "sheer"]),
  tip: z.string().describe("Two or three sentences of practical technique for her face today, second person"),
  corrects: z.enum(["acne", "redness", "dark_circle_v2", "age_spot", "oiliness", "eye_bag"]).nullable()
    .describe("The concern this step fixes today, or null"),
});

export const LookSchema = z.object({
  name: z.string().describe("Two or three evocative words"),
  description: z.string().describe("One sentence, under 20 words, what the look is and how long it takes"),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).describe("1 easy, 2 medium, 3 difficult"),
  minutes: z.number().int().min(3).max(45),
  steps: z.array(StepSchema).min(3).max(8),
});

export const LookPlanSchema = z.object({ looks: z.array(LookSchema).length(5) });

export type LookPlan = z.infer<typeof LookPlanSchema>;
