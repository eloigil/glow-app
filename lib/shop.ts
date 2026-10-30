import type { Step } from "@/lib/types";

// Amazon search links built from the step's product and shade. YouCam has no product catalog, so these
// find matching products rather than one exact item. An Amazon Associates tag is optional.
const TAG = process.env.NEXT_PUBLIC_AMAZON_TAG;

// What the product is actually called in a store, so "Eyelashes, lifted wisps" searches for mascara.
const PRODUCT: Record<Step["category"], string> = {
  foundation: "foundation", concealer: "concealer", contour: "contour stick", bronzer: "bronzer", blush: "blush",
  highlighter: "highlighter", eyebrows: "brow pencil", eye_shadow: "eyeshadow", eye_liner: "eyeliner",
  eyelashes: "mascara", lip_color: "lipstick",
};

/** "Concealer, soft sand" -> "soft sand concealer" */
export function shopQuery(step: Step): string {
  const shade = step.title.split(/,\s*/)[1];
  return `${shade ? `${shade} ` : ""}${PRODUCT[step.category]}`.toLowerCase();
}

export function amazonUrl(step: Step): string {
  const url = new URL("https://www.amazon.com/s");
  url.searchParams.set("k", shopQuery(step));
  if (TAG) url.searchParams.set("tag", TAG);
  return url.toString();
}
