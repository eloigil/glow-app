import type { Landmarks } from "@/lib/landmarks";
import type { MakeupCategory } from "@/lib/types";

// "How to apply": the hand motion for each product, drawn on her own face from MediaPipe landmarks.
// Each side is written once with the indices on the image's left and mirrored (MIRROR) for the right.

export type Pt = { x: number; y: number };
/** One continuous brush movement, in image pixels. */
export type Stroke = { points: Pt[]; width: number };

/** What the brush is doing, said in a few words under the animation. */
export const MOTION: Record<MakeupCategory, string> = {
  foundation: "Dot on, then blend out from the center",
  concealer: "Triangle under each eye, then tap it in",
  contour: "Ear toward mouth, under the cheekbone",
  bronzer: "A 3 shape: temple, cheekbone, jaw",
  blush: "Small circles on the apples, then sweep up",
  highlighter: "Tops of the cheekbones and down the nose",
  eyebrows: "Inner to outer, following the arch",
  eye_shadow: "Windshield wipers across the lid",
  eye_liner: "Along the lash line, then flick out",
  eyelashes: "Wiggle at the root, pull up and out",
  lip_color: "Outline first, then fill in",
};

// Image-left index -> its image-right twin (MediaPipe face mesh).
const PAIRS: [number, number][] = [
  [234, 454], [93, 323], [187, 411], [116, 345], [117, 346], [118, 347], [127, 356], [54, 284], [21, 251],
  [58, 288], [214, 434], [172, 397], [36, 266], [50, 280], [205, 425],
  [33, 263], [246, 466], [161, 388], [160, 387], [159, 386], [158, 385], [157, 384], [173, 398], [133, 362], [145, 374],
  [70, 300], [63, 293], [105, 334], [66, 296], [107, 336], [46, 276], [53, 283], [52, 282], [65, 295], [55, 285],
];
const MIRROR = new Map(PAIRS);

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const add = (a: Pt, b: Pt, k = 1): Pt => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** The strokes for one step, both sides, in the order she would do them. */
export function strokesFor(category: MakeupCategory, lm: Landmarks, w: number, h: number): Stroke[] {
  const at = (i: number): Pt => ({ x: lm[i].x * w, y: lm[i].y * h });
  const face = dist(at(234), at(454));
  // The face's own "up", so strokes follow a tilted head.
  const chinToTop = dist(at(152), at(10));
  const up: Pt = { x: (at(10).x - at(152).x) / chinToTop, y: (at(10).y - at(152).y) / chinToTop };

  /** One side's strokes, written with image-left indices, then repeated with the right side's. */
  const sides = (side: (p: (i: number) => Pt) => Stroke[]) => [...side(at), ...side((i) => at(MIRROR.get(i) ?? i))];

  switch (category) {
    case "foundation": {
      const brow = lerp(at(10), at(168), 0.45);
      return [
        { points: [lerp(brow, at(54), 0.7), brow, lerp(brow, at(284), 0.7)], width: face * 0.2 },
        ...sides((p) => [{ points: [p(36), p(117), p(205), p(93), p(187), p(58)], width: face * 0.2 }]),
        { points: [at(168), at(1)], width: face * 0.1 },
        { points: [lerp(at(17), at(152), 0.2), lerp(at(17), at(152), 0.7)], width: face * 0.18 },
      ];
    }
    case "concealer":
      return sides((p) => {
        const inner = lerp(p(133), p(36), 0.2);
        const outer = lerp(p(33), p(117), 0.45);
        const tip = lerp(p(145), p(50), 0.75);
        return [{ points: [inner, outer, tip, inner, lerp(inner, tip, 0.5), lerp(outer, tip, 0.5)], width: face * 0.06 }];
      });
    case "contour":
      return sides((p) => {
        // The hollow under the cheekbone: from the top of the ear halfway to the mouth corner, bowing slightly down.
        const end = lerp(p(234), p(61), 0.5);
        const mid = lerp(lerp(p(234), end, 0.5), p(93), 0.3);
        return [{ points: [p(234), mid, end, lerp(p(234), end, 0.35)], width: face * 0.07 }];
      });
    case "bronzer":
      return sides((p) => [
        { points: [p(54), p(127), lerp(p(117), p(116), 0.5), p(93), lerp(p(58), p(214), 0.4), p(172)], width: face * 0.09 },
      ]);
    case "blush":
      return sides((p) => {
        const c = lerp(p(50), p(116), 0.25); // the apple: under the pupil, a little up and out
        const r = face * 0.055;
        const loops = Array.from({ length: 25 }, (_, k) => {
          const a = (k / 10) * Math.PI * 2;
          return { x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r };
        });
        return [{ points: [...loops, lerp(c, p(127), 0.5), p(127)], width: face * 0.07 }];
      });
    case "highlighter":
      return [
        ...sides((p) => [{ points: [p(118), p(117), p(116), p(127)], width: face * 0.05 }]),
        { points: [at(168), lerp(at(6), at(195), 0.6)], width: face * 0.035 },
      ];
    case "eyebrows":
      return sides((p) => {
        const top = [70, 63, 105, 66, 107].map(p);
        const bottom = [46, 53, 52, 65, 55].map(p);
        const mid = top.map((t, k) => lerp(t, bottom[k], 0.5)).reverse(); // inner to outer
        return [{ points: mid, width: dist(top[2], bottom[2]) * 0.9 }];
      });
    case "eye_shadow":
      return sides((p) => {
        const pairs: [number, number][] = [[133, 55], [157, 65], [159, 52], [161, 53], [33, 46]];
        const zig = pairs.flatMap(([lid, brow]) => [p(lid), lerp(p(lid), p(brow), 0.45)]);
        return [{ points: zig, width: face * 0.05 }];
      });
    case "eye_liner":
      return sides((p) => {
        const lid = [133, 173, 157, 158, 159, 160, 161, 246, 33].map(p);
        const out = add(p(33), { x: p(33).x - p(133).x, y: p(33).y - p(133).y }, 0.22);
        return [{ points: [...lid, add(out, up, dist(p(33), p(133)) * 0.14)], width: face * 0.025 }];
      });
    case "eyelashes":
      return sides((p) => {
        const lash = face * 0.05;
        const flicks = [133, 157, 159, 161, 33].map(p).flatMap((q) => [q, add(q, up, lash)]);
        return [{ points: flicks, width: face * 0.03 }];
      });
    case "lip_color": {
      const outline = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146, 61].map(at);
      const top = [185, 40, 37, 267, 270, 409].map(at);
      const bottom = [146, 91, 84, 314, 321, 375].map(at);
      return [
        { points: outline, width: face * 0.025 },
        { points: top.flatMap((t, k) => [t, bottom[k]]), width: face * 0.05 },
      ];
    }
  }
}

/** A smooth SVG path through the points (Catmull-Rom as cubic Béziers). */
export function pathOf(points: Pt[]): string {
  const p = points;
  let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [a, b, c, e] = [p[i - 1] ?? p[i], p[i], p[i + 1], p[i + 2] ?? p[i + 1]];
    const c1 = { x: b.x + (c.x - a.x) / 6, y: b.y + (c.y - a.y) / 6 };
    const c2 = { x: c.x - (e.x - b.x) / 6, y: c.y - (e.y - b.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${c.x.toFixed(1)},${c.y.toFixed(1)}`;
  }
  return d;
}
