"use client";

import { useRef, useState } from "react";

/** PRD stretch: drag (or arrow keys) to compare her original photo with the finished look. */
export function BeforeAfter({
  before,
  after,
  alt,
  beforeLabel = "Before",
}: {
  before: string;
  after: string;
  alt: string;
  /** What the left image is: her bare photo ("Before") or, for a copied look, the goal. */
  beforeLabel?: string;
}) {
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
      <img src={before} alt={beforeLabel === "Before" ? "Your photo before makeup" : `${beforeLabel} image`} draggable={false} className="absolute inset-0 size-full object-cover" />
      {/* eslint-disable-next-line @next/next/no-img-element -- data/object URL */}
      <img
        src={after}
        alt={alt}
        draggable={false}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
      />
      <span className="glass absolute bottom-6 left-3 rounded-full px-2.5 py-0.5 text-xs font-medium text-ink">{beforeLabel}</span>
      <span className="glass absolute right-3 bottom-6 rounded-full px-2.5 py-0.5 text-xs font-medium text-ink">After</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_8px_rgb(23_20_26/0.3)]" style={{ left: `${pos}%` }} />
      <div
        role="slider"
        tabIndex={0}
        aria-label={`Compare ${beforeLabel.toLowerCase()} and after`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pos}
        aria-valuetext={pos === 0 ? beforeLabel : pos === 100 ? "After" : `${pos}% after`}
        onKeyDown={(e) => {
          const step = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5 }[e.key];
          if (step !== undefined || e.key === "Home" || e.key === "End") {
            e.preventDefault();
            e.stopPropagation(); // the tutorial listens for arrows on window
            setPos((p) => (e.key === "Home" ? 0 : e.key === "End" ? 100 : Math.min(100, Math.max(0, p + step!))));
          }
        }}
        // The line runs edge to edge; the 44px handle stays fully inside.
        style={{ left: `clamp(22px, ${pos}%, calc(100% - 22px))` }}
        className="glass pointer-events-auto absolute top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full text-ink focus-visible:outline-2 focus-visible:outline-rose"
      >
        <span aria-hidden className="text-sm leading-none">‹ ›</span>
      </div>
    </div>
  );
}
