import type { ApiErrorBody } from "@/lib/types";
import { YouCamError } from "./client";

// spec.md > Important Failure Modes. Codes: https://docs.perfectcorp.com/develop/error_codes.md
const PHOTO: [RegExp, string][] = [
  [/^error_no_face$/, "We couldn't find a face. Try a front-facing photo."],
  [/^error_multiple_people$/, "Only one face, please."],
  [/too_small$/, "Move closer so your face fills the frame."],
  [/angle|out_of_bound/, "Face the camera straight on."],
  [/lighting/, "It's a bit dark. Try softer, brighter light."],
  [/^error_|exceed_max_filesize/, "This photo didn't work. Try another."],
];

const CREDITS = "We ran out of credits for the demo. Try later.";

export function toApiError(err: unknown): { status: number; body: ApiErrorBody } {
  const code = err instanceof YouCamError ? err.code : "unknown";
  const outage = err instanceof YouCamError && (err.status ?? 0) >= 500;
  for (const [re, message] of outage ? [] : PHOTO) {
    if (re.test(code)) return { status: 422, body: { error: { kind: "photo", code, message } } };
  }
  if (code !== "unknown") console.error("[youcam]", code, err instanceof Error ? err.message : err);
  else console.error(err);
  // Credits, timeouts, outages and anything unexpected all get the same calm demo message.
  return { status: 503, body: { error: { kind: code === "CreditInsufficiency" ? "credits" : "unknown", code, message: CREDITS } } };
}
