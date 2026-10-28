"use client";

import { useRef, useState } from "react";

/** PRD stretch: drag (or arrow keys) to compare her original photo with the finished look. */
export function BeforeAfter({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);

  function move(clientX: number) {
    const r = ref.current!.getBoundingClientRect();
    setPos(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        move(e.clientX);
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- data/object URL */}
      <img src={before} alt="Your photo before makeup" draggable={false} className="absolute inset-0 size-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element -- data/object URL */}
      <img
        src={after}
        alt={alt}
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />
      <span className="glass absolute bottom-6 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium text-ink">Before</span>
      <span className="glass absolute right-3 bottom-6 rounded-full px-2.5 py-0.5 text-xs font-medium text-ink">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgb(23_20_26/0.3)]" style={{ left: `${pos}%` }}>
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare before and after"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pos}
          aria-valuetext={`${pos}% before`}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
              e.preventDefault();
              e.stopPropagation(); // the tutorial listens for arrows on window
              setPos((p) => Math.min(100, Math.max(0, p + (e.key === "ArrowLeft" ? -5 : 5))));
            }
          }}
          className="glass pointer-events-auto absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-rose"
        >
          <span aria-hidden className="text-sm leading-none">‹ ›</span>
        </div>
      </div>
    </div>
  );
}
