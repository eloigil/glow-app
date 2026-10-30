"use client";

import { useState } from "react";
import { ProductPreview } from "@/components/ProductArt";
import { ProductSheet } from "@/components/ProductSheet";
import type { Step } from "@/lib/types";

/** The suggested products a look needs, one tile per distinct product, in step order. */
export function ProductCarousel({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState<number>();
  const seen = new Set<string>();
  const items = steps
    .map((step, index) => ({ step, index }))
    .filter(({ step }) => {
      // Older saved looks have no product; skip them rather than show an empty tile.
      const p = step.product as Step["product"] | undefined;
      if (!p) return false;
      const key = `${p.brand}|${p.name}|${p.shade}`;
      return !seen.has(key) && !!seen.add(key);
    });
  if (!items.length) return null;
  const current = items.find((i) => i.index === open);

  return (
    <>
      <p className="mt-4 mb-2 flex items-baseline justify-between px-0.5 text-xs font-medium text-ink-muted">
        <span>Products for this look</span>
        <span className="tabular-nums">{items.length}</span>
      </p>
      <ul className="-mx-2 flex snap-x snap-mandatory scroll-px-2 gap-3 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ step, index }) => (
          <li key={index} className="w-[118px] shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`${step.product.brand} ${step.product.name}, ${step.product.shade}`}
              className="group flex w-full flex-col text-left"
            >
              {/* A fixed light well in both themes; white photo backgrounds blend into it. */}
              <span className="grid aspect-[4/5] w-full place-items-center overflow-hidden rounded-[10px] bg-[#f6f0f2] transition-transform duration-200 group-active:scale-[0.98] motion-reduce:transition-none">
                <ProductPreview step={step} size={84} />
              </span>
              <span className="mt-2 truncate text-[11px] leading-tight text-ink-muted">{step.product.brand}</span>
              <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug font-medium">{step.product.name}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[11px] leading-tight text-ink-muted">
                <Swatch colors={step.colors} size={10} />
                <span className="truncate">{step.product.shade}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {current && <ProductSheet step={current.step} index={current.index} onClose={() => setOpen(undefined)} />}
    </>
  );
}

/** Round swatch of the step's first color, split in half when the step uses two. */
export function Swatch({ colors, size }: { colors: string[]; size: number }) {
  const [a, b] = colors;
  return (
    <span
      aria-hidden
      className="block shrink-0 rounded-full border border-line"
      style={{ width: size, height: size, background: b ? `linear-gradient(90deg, ${a} 50%, ${b} 50%)` : a }}
    />
  );
}

