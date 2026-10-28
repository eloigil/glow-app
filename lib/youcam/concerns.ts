import type { ConcernKey } from "@/lib/types";

// spec.md > Data Model: six SD concerns (5-8 concerns = 12 units). skin_type rides along in the same bracket.
export const CONCERNS: Record<ConcernKey, string> = {
  acne: "Blemishes",
  redness: "Redness",
  dark_circle_v2: "Dark circles",
  age_spot: "Spots",
  oiliness: "Shine",
  eye_bag: "Puffy eyes",
};

export const DST_ACTIONS = [...Object.keys(CONCERNS), "skin_type"];

/** ui_score is 1-100, higher is healthier. Below this it becomes one of today's points.
 * Tuned on the first real run: visible freckles and under-eye shadows scored 79-81, clean areas 96-99. */
export const POINT_THRESHOLD = 85;
