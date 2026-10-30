"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { animate } from "motion/react";
import type { Landmarks } from "@/lib/landmarks";
import { MOTION, pathOf, strokesFor } from "@/lib/strokes";
import type { MakeupCategory } from "@/lib/types";

const WHERE_MS = 900; // dotted guides alone: where it goes
const SETTLE_MS = 450; // the full render fades in under the last stroke

/**
 * "How to apply": dotted guides show where the product goes, then a brush follows each stroke and paints this
 * step's real render onto the previous layer as it moves. Sized like an object-cover image (SVG "slice").
 */
export function ApplyAnimation({
  before,
  after,
  landmarks,
  category,
  color,
  onDone,
}: {
  before: string;
  after: string;
  landmarks: Landmarks;
  category: MakeupCategory;
  color: string;
  onDone: () => void;
}) {
  const id = useId();
  const [size, setSize] = useState<{ w: number; h: number }>();
  const [phase, setPhase] = useState<"where" | "how" | "done">("where");
  const paths = useRef<(SVGPathElement | null)[]>([]);
  const brush = useRef<SVGGElement>(null);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const img = new Image();
    img.onload = () => setSize({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => done.current();
    img.src = after;
  }, [after]);

  const strokes = useMemo(() => size && strokesFor(category, landmarks, size.w, size.h), [size, category, landmarks]);

  useEffect(() => {
    if (!strokes || !size) return;
    let stop = () => {};
    let settle: ReturnType<typeof setTimeout>;
    const start = setTimeout(() => {
      setPhase("how");
      const els = paths.current.slice(0, strokes.length).filter((e): e is SVGPathElement => !!e);
      const lens = els.map((e) => e.getTotalLength());
      const total = lens.reduce((a, b) => a + b, 0);
      const starts = lens.map((_, i) => lens.slice(0, i).reduce((a, b) => a + b, 0));
      const controls = animate(0, 1, {
        // Same brush speed for every product, within reason.
        duration: Math.min(4.5, Math.max(1.8, total / (size.w * 0.9))),
        ease: "linear",
        onUpdate: (p) => {
          const at = p * total;
          els.forEach((el, i) => {
            const local = Math.min(1, Math.max(0, (at - starts[i]) / lens[i]));
            el.style.strokeDashoffset = String(1 - local);
            if (at >= starts[i] && at <= starts[i] + lens[i]) {
              const q = el.getPointAtLength(local * lens[i]);
              brush.current?.setAttribute("transform", `translate(${q.x} ${q.y})`);
            }
          });
        },
        onComplete: () => {
          setPhase("done");
          settle = setTimeout(() => done.current(), SETTLE_MS);
        },
      });
      stop = () => controls.stop();
    }, WHERE_MS);
    return () => {
      clearTimeout(start);
      clearTimeout(settle);
      stop();
    };
  }, [strokes, size]);

  if (!size || !strokes) return null;
  const { w, h } = size;
  const first = strokes[0].points[0];
  const tip = Math.min(w * 0.03, Math.max(w * 0.02, strokes[0].width * 0.35));

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <filter id={`${id}-soft`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={w * 0.008} />
          </filter>
          <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy={w * 0.003} stdDeviation={w * 0.005} floodColor="#17141a" floodOpacity="0.35" />
          </filter>
          <mask id={`${id}-paint`} maskUnits="userSpaceOnUse" x="0" y="0" width={w} height={h}>
            <g filter={`url(#${id}-soft)`}>
              {strokes.map((s, i) => (
                <path
                  key={i}
                  ref={(el) => {
                    paths.current[i] = el;
                  }}
                  d={pathOf(s.points)}
                  pathLength={1}
                  fill="none"
                  stroke="white"
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1 1"
                  style={{ strokeDashoffset: 1 }}
                />
              ))}
            </g>
          </mask>
        </defs>
        <image href={before} width={w} height={h} />
        <image href={after} width={w} height={h} mask={`url(#${id}-paint)`} />
        <image href={after} width={w} height={h} className="transition-opacity duration-400" style={{ opacity: phase === "done" ? 1 : 0 }} />
        <g className="transition-opacity duration-500" style={{ opacity: phase === "where" ? 0.9 : phase === "how" ? 0.4 : 0 }}>
          {strokes.map((s, i) => (
            <path
              key={i}
              d={pathOf(s.points)}
              fill="none"
              stroke="white"
              strokeWidth={w * 0.004}
              strokeDasharray={`${w * 0.006} ${w * 0.01}`}
              strokeLinecap="round"
              className="motion-safe:animate-[guide_1.2s_linear_infinite]"
            />
          ))}
        </g>
        <g
          ref={brush}
          transform={`translate(${first.x} ${first.y})`}
          className="transition-opacity duration-300"
          style={{ opacity: phase === "how" ? 1 : 0 }}
          filter={`url(#${id}-shadow)`}
        >
          <circle r={tip} fill={color} stroke="white" strokeWidth={w * 0.004} />
        </g>
      </svg>
      <p className="glass absolute top-24 left-3 max-w-[70%] rounded-full px-3 py-1 text-xs font-medium" aria-live="polite">
        {MOTION[category]}
      </p>
    </div>
  );
}
