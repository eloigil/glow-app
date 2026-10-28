// Shared contract between the screens and the server routes (spec.md > Data Model).

export type ConcernKey = "acne" | "redness" | "dark_circle_v2" | "age_spot" | "oiliness" | "eye_bag";

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

// Looks and tutorial steps (spec.md > Data Model). A step is the simplified shape the LLM writes;
// lib/youcam/effects.ts turns it into the exact YouCam Makeup VTO effect.
export type MakeupCategory =
  | "foundation" | "concealer" | "contour" | "bronzer" | "blush" | "highlighter"
  | "eyebrows" | "eye_shadow" | "eye_liner" | "eyelashes" | "lip_color";

export type Finish = "matte" | "satin" | "shimmer" | "gloss" | "sheer";

export type Step = {
  title: string;
  category: MakeupCategory;
  /** Pattern id from lib/youcam/patterns.json, null for foundation, concealer and lip_color. */
  pattern: string | null;
  /** Hex colors, one per pattern color slot. */
  colors: string[];
  /** 0-100 */
  intensity: number;
  finish: Finish;
  tip: string;
  /** The point this step fixes today, if any. */
  corrects: ConcernKey | null;
};

export type Difficulty = 1 | 2 | 3;

export type Look = { id: string; name: string; description: string; difficulty: Difficulty; minutes: number; steps: Step[] };

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
