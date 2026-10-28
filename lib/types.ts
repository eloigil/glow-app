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
