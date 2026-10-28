import { DropletIcon, SparklesIcon, Sun03Icon, ViewIcon } from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { ConcernKey } from "@/lib/types";

/** Icon and short hint per concern, shared by Skin Analysis and the Tutorial. */
export const CONCERN_LOOK: Record<ConcernKey, { icon: IconSvgElement; hint: string }> = {
  acne: { icon: SparklesIcon, hint: "Blemishes to cover" },
  redness: { icon: Sun03Icon, hint: "Areas to even out" },
  dark_circle_v2: { icon: ViewIcon, hint: "Under-eye shadows to brighten" },
  age_spot: { icon: SparklesIcon, hint: "Spots to soften" },
  oiliness: { icon: DropletIcon, hint: "Shine to control" },
  eye_bag: { icon: ViewIcon, hint: "Puffiness to lift" },
};
