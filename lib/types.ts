import type { z } from "zod";
import type { CATEGORIES, CONCERN_KEYS, FINISHES, LookSchema, ProductSchema, StepSchema } from "@/lib/openai/schema";

// Shared contract between the screens and the server routes (spec.md > Data Model).

export type ConcernKey = (typeof CONCERN_KEYS)[number];

export type Concern = {
  key: ConcernKey;
  label: string;
  /** YouCam ui_score, 1-100, higher is healthier. */
  uiScore: number;
  /** True when the score is low enough to count as one of today's points. */
  isPoint: boolean;
  /** Mask image as a data URL, ready for an <img> or CSS mask-image. */
  mask?: string;
};

export type Tone = { skinHex: string; lipHex: string; browHex: string; label: string };

/** POST /api/analyze — multipart form: `photo` (File), `hasTone` ("1" when the browser already has a cached Tone). */
export type AnalyzeResponse = {
  fileId: string;
  concerns: Concern[];
  skinType?: string;
  /** Present when the tone call ran (no cached tone was sent). */
  tone?: Tone;
  /** Replay mode only: the recorded photo as a data URL, so masks line up with the face shown. */
  photo?: string;
};

export type ApiErrorKind = "photo" | "credits" | "unknown";

/** Every route returns this shape with a non-2xx status on failure. */
export type ApiErrorBody = { error: { kind: ApiErrorKind; code: string; message: string } };

// Looks and tutorial steps (spec.md > Data Model). The shapes come from the zod schema OpenAI fills;
// lib/youcam/effects.ts turns a Step into the exact YouCam Makeup VTO effect.
export type MakeupCategory = (typeof CATEGORIES)[number];
export type Finish = (typeof FINISHES)[number];
/** title, category, pattern (catalog id or null), colors (one hex per pattern slot), intensity 10-90, finish, tip, corrects. */
export type Step = z.infer<typeof StepSchema>;
export type Product = z.infer<typeof ProductSchema>;

export type Difficulty = 1 | 2 | 3;

export type Look = Omit<z.infer<typeof LookSchema>, "difficulty"> & { id: string; difficulty: Difficulty };

/** POST /api/looks — body: { concerns, skinType, tone } */
export type LooksRequest = { concerns: Concern[]; skinType?: string; tone?: Tone };
export type LooksResponse = { looks: Look[] };

/** POST /api/render — paints steps[0..n] cumulatively onto the uploaded photo. */
export type RenderRequest = { fileId: string; steps: Step[] };
export type RenderResponse = {
  image: string;
  /** Replay mode only: no recording matched these steps, so this is the unpainted photo. */
  placeholder?: true;
};
