import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { OPENAI_MODEL } from "./model";
import { LookPlanSchema, type LookPlan } from "./schema";
import { PATTERNS, UNPATTERNED, patternFor } from "@/lib/youcam/effects";
import { POINT_THRESHOLD } from "@/lib/youcam/concerns";
import type { ConcernKey, Difficulty, Look, LooksRequest, MakeupCategory } from "@/lib/types";

/** Which products can honestly fix which concern. The model gamed "corrects" without this. */
const CORRECTORS: Record<ConcernKey, MakeupCategory[]> = {
  acne: ["concealer"],
  redness: ["foundation", "concealer"],
  dark_circle_v2: ["concealer"],
  age_spot: ["concealer", "foundation"],
  oiliness: ["foundation"],
  eye_bag: ["concealer", "highlighter"],
};

// spec.md > Looks Route: one OpenAI call (plus one retry with the problems listed), then validation.

const catalog = Object.entries(PATTERNS)
  .map(([cat, list]) => `${cat}: ${list!.map((p) => `${p.id} (${p.colors} color${p.colors > 1 ? "s" : ""}: ${p.look})`).join("; ")}`)
  .join("\n");

const SYSTEM = `You are GlowApp's makeup artist. You design six makeup looks for one woman for TODAY, from her skin read,
and break each look into the ordered steps she will follow on her own face. Each step becomes one rendered layer.

Rules:
- Exactly 6 looks: two easy (1), two medium (2), two difficult (3).
- Easy looks: 4-5 steps. Medium: 5-6. Difficult: 7-8. Order steps the way a makeup artist applies them (base first, lips last).
- Every look is a real look, not just a base: after the correcting steps it must have at least one cheek step (blush, bronzer,
  contour or highlighter) and end with lip_color. Medium and difficult looks also work the eyes (eye_shadow, eye_liner, eyelashes, eyebrows).
  Vary the six looks: different blush shapes, lip colors and finishes.
- Every look must correct each of today's points: some step's "corrects" array includes it.
  Only these categories may correct a point: ${Object.entries(CORRECTORS).map(([k, v]) => `${k} -> ${v.join(" or ")}`).join("; ")}.
  Keep it to at most two correcting steps right after (or as) the base: one step may fix several points
  (e.g. one under-eye concealer for dark_circle_v2 and eye_bag). Only use today's points listed below. Those steps' tips must name each point in plain words
  (spots, dark circles, puffy eyes...). Every other step has corrects [].
- Shades must suit her skin tone: foundation and concealer close to her skin hex (concealer slightly lighter for under-eyes).
- Every step must be visible in its own rendered layer. Intensity: foundation 40-55, concealer 50-70,
  blush/bronzer/contour/highlighter 50-75, eyes and brows 55-85, lips 60-85. Easy looks sit at the low end, difficult at the high end.
- Use only these categories and pattern ids. foundation, concealer and lip_color take pattern null.
  Give exactly as many colors as the pattern has color slots.
${catalog}
- Tips: warm, concrete, second person, 2-3 sentences, about technique for her face today (where, how much, which tool).
- Names and descriptions: no em dashes.`;

/** Points are derived here, not trusted from the browser, so they always match the analyze route's threshold. */
const pointsOf = (req: LooksRequest) => req.concerns.filter((c) => c.uiScore < POINT_THRESHOLD);

function describe(req: LooksRequest) {
  const points = pointsOf(req);
  return [
    `Skin tone: ${req.tone ? `${req.tone.label}, skin ${req.tone.skinHex}, lips ${req.tone.lipHex}, brows ${req.tone.browHex}` : "unknown"}.`,
    `Skin type: ${req.skinType ?? "unknown"}.`,
    `Today's points (concern key, score 1-100 where lower is more visible): ${points.length ? points.map((c) => `${c.key} ${c.uiScore}`).join(", ") : "none, her skin looks great today"}.`,
  ].join("\n");
}

/** Problems that make a plan unusable; empty means valid. */
export function validate(plan: LookPlan, req: LooksRequest): string[] {
  const problems: string[] = [];
  const levels = new Set(plan.looks.map((l) => l.difficulty));
  for (const d of [1, 2, 3] as const) if (!levels.has(d)) problems.push(`No look has difficulty ${d}.`);
  const points = pointsOf(req).map((c) => c.key);
  plan.looks.forEach((look, i) => {
    for (const p of points) {
      if (!look.steps.some((s) => s.corrects.includes(p))) problems.push(`Look ${i + 1} "${look.name}" has no step correcting ${p}.`);
    }
    for (const s of look.steps) {
      for (const c of s.corrects) {
        if (!points.includes(c)) problems.push(`Look ${i + 1}: ${c} is not one of today's points; only use ${points.join(", ") || "none"}.`);
        if (!CORRECTORS[c].includes(s.category)) {
          problems.push(`Look ${i + 1}: a ${s.category} step can't correct ${c}; use ${CORRECTORS[c].join(" or ")}.`);
        }
      }
    }
    if (look.steps.at(-1)?.category !== "lip_color") problems.push(`Look ${i + 1} "${look.name}" must end with lip_color.`);
    look.steps.forEach((s, j) => {
      const where = `Look ${i + 1} step ${j + 1} (${s.category})`;
      if (UNPATTERNED.includes(s.category)) return;
      const p = patternFor(s);
      if (!p) problems.push(`${where} uses unknown pattern "${s.pattern}".`);
      else if (s.colors.length < p.colors) problems.push(`${where} pattern ${p.id} needs ${p.colors} colors.`);
    });
  });
  return problems;
}

/** Last resort after the retry: drop steps YouCam can't paint, then fill any missing difficulty
 * by relabeling looks in order of step count (fewest = easy, most = difficult). */
function repair(plan: LookPlan, req: LooksRequest): LookPlan {
  const points = pointsOf(req).map((c) => c.key);
  const looks = plan.looks.map((l) => ({
    ...l,
    steps: l.steps
      .filter((s) => UNPATTERNED.includes(s.category) || patternFor(s))
      .map((s) => ({ ...s, corrects: s.corrects.filter((c) => points.includes(c) && CORRECTORS[c].includes(s.category)) })),
  }));
  for (const level of [1, 2, 3]) {
    if (looks.some((l) => l.difficulty === level)) continue;
    const bySteps = [...looks].sort((a, b) => a.steps.length - b.steps.length);
    const pick = level === 1 ? bySteps[0] : level === 3 ? bySteps[bySteps.length - 1] : bySteps[2];
    pick.difficulty = level;
  }
  return { looks: looks.filter((l) => l.steps.length > 0) };
}

export async function planLooks(req: LooksRequest): Promise<Look[]> {
  const client = new OpenAI();
  const input: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: describe(req) },
  ];
  let plan: LookPlan | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.responses.parse({
      model: OPENAI_MODEL,
      input,
      text: { format: zodTextFormat(LookPlanSchema, "look_plan") },
    });
    // Keep the last usable plan even if the retry comes back empty.
    if (res.output_parsed) plan = res.output_parsed;
    if (!plan) continue;
    const problems = validate(plan, req);
    if (!problems.length || attempt === 1) break;
    input.push({ role: "assistant", content: JSON.stringify(plan) }, { role: "user", content: `Fix these problems and return the full plan again:\n- ${problems.join("\n- ")}` });
  }
  if (!plan) throw new Error("OpenAI returned no plan");
  return repair(plan, req).looks.map((l, i) => ({ ...l, id: `look-${i + 1}`, difficulty: l.difficulty as Difficulty }));
}
