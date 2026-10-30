import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { OPENAI_MODEL } from "./model";
import { addProductImages, cleanSteps, describe, lookProblems, STEP_RULES } from "./plan";
import { LookSchema } from "./schema";
import type { z } from "zod";
import type { Difficulty, Look, LooksRequest } from "@/lib/types";

// Copy a look: OpenAI vision reads the makeup in her inspiration photo and breaks it into steps on her own face.

const SYSTEM = `You are GlowApp's makeup artist. She shows you a photo of a makeup look she loves (someone else's face)
and, when available, that look already transferred onto her own face. Recreate it as one look she can follow step by step
on her own face. Each step becomes one rendered layer.

Rules:
- Copy what you see: for each visible area (base, cheeks, eyes, brows, lips) pick the category, the pattern that matches its
  placement and shape, the colors as they appear in the photo, the finish and an intensity that matches how strong it looks.
  Skip areas with no visible makeup, except the base and lips.
- Foundation and concealer follow her skin, not the model's: shades close to her skin hex.
- Order steps the way a makeup artist applies them (base first, lips last), 4-8 steps, ending with lip_color.
- Difficulty from the work involved: 1 for a light, quick look, 2 for a defined look, 3 for detailed eyes or several techniques.
- Name: two or three evocative words for the look. Description: one sentence on the look and how long it takes.
${STEP_RULES}`;

/** One look copied from her inspiration photo (and the transfer result, to read colors as they sit on her skin). */
export async function copyLook(req: LooksRequest, inspiration: string, transferred?: string): Promise<Look> {
  const client = new OpenAI();
  const content: OpenAI.Responses.ResponseInputContent[] = [
    { type: "input_text", text: `${describe(req)}\nThe first image is the look she wants${transferred ? "; the second is that look on her face" : ""}.` },
    { type: "input_image", image_url: inspiration, detail: "high" },
  ];
  if (transferred) content.push({ type: "input_image", image_url: transferred, detail: "high" });
  const input: OpenAI.Responses.ResponseInputItem[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content },
  ];

  let look: z.infer<typeof LookSchema> | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.responses.parse({ model: OPENAI_MODEL, input, text: { format: zodTextFormat(LookSchema, "look") } });
    if (res.output_parsed) look = res.output_parsed;
    if (!look) continue;
    const problems = lookProblems(look, 0, req);
    if (!problems.length || attempt === 1) break;
    input.push({ role: "assistant", content: JSON.stringify(look) }, { role: "user", content: `Fix these problems and return the full look again:\n- ${problems.join("\n- ")}` });
  }
  if (!look) throw new Error("OpenAI returned no look");
  // The id is set per request by the route, so replayed copies don't collide.
  const copied: Look = { ...cleanSteps(look, req), id: "copy", difficulty: look.difficulty as Difficulty };
  await addProductImages([copied]);
  return copied;
}
