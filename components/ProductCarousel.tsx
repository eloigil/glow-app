"use client";

import { useState } from "react";
import { ProductPreview } from "@/components/ProductArt";
import { ProductSheet } from "@/components/ProductSheet";
import { useSession } from "@/lib/session";
import { linkFor } from "@/lib/useProductLinks";
import type { Step } from "@/lib/types";

/** The suggested products a look needs, one tile per distinct product, in step order. */
export function ProductCarousel({ steps }: { steps: Step[] }) {
  const [open, setOpen] = useState<number>();
  const { session } = useSession();
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
      <p className="mt-3 mb-1.5 px-0.5 text-xs font-medium text-ink-muted">Products for this look</p>
      <ul className="-mx-2 flex snap-x snap-mandatory gap-2 overflow-x-auto px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map(({ step, index }) => (
          <li key={index} className="shrink-0 snap-start">
            <button
              type="button"
              onClick={() => setOpen(index)}
              aria-label={`${step.product.brand} ${step.product.name}, ${step.product.shade}`}
              className="flex w-[84px] flex-col items-start gap-1.5 rounded-[8px] border border-line bg-surface p-1.5 text-left"
            >
              <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-[8px] bg-white">
                <ProductPreview step={step} size={52} />
              </span>
              <span className="flex w-full items-center gap-1">
                <Swatch colors={step.colors} size={10} />
                <span className="min-w-0 truncate text-[11px] leading-tight font-medium">{step.title.split(",")[0]}</span>
              </span>
              <span className="w-full truncate text-[10px] leading-tight text-ink-muted">{step.product.brand}</span>
              <StoreHint store={linkFor(session, step)?.store} />
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

function StoreHint({ store }: { store?: string }) {
  return store ? <span className="-mt-1 w-full truncate text-[10px] leading-tight text-ink-muted">at {store}</span> : null;
}
