import { useState } from "react";
import { ArrowLeft01Icon, ArrowRight01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { CONCERN_LOOK } from "@/components/concernLook";
import { GlassSheet } from "@/components/GlassSheet";
import { ProductPreview } from "@/components/ProductArt";
import { Swatch } from "@/components/ProductCarousel";
import { ProductSheet } from "@/components/ProductSheet";
import { Icon } from "@/components/Icon";
import { useSession } from "@/lib/session";
import { amazonUrl, shopQuery } from "@/lib/shop";
import { linkFor } from "@/lib/useProductLinks";
import type { Concern, Step } from "@/lib/types";

/** Glass sheet under the face: what this step applies, why today, how to do it. */
export function TipsSheet({
  step,
  index,
  total,
  concerns,
  error,
  onRetry,
  onBack,
  onNext,
}: {
  step: Step;
  index: number;
  total: number;
  concerns: Concern[];
  error?: string;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const last = index === total - 1;
  const { session } = useSession();
  const link = linkFor(session, step);
  const [shopping, setShopping] = useState(false);
  return (
    <GlassSheet className="flex max-h-[52%] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3">
        {concerns.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-wash py-1 pr-3 pl-1.5 text-xs font-medium">
            <span className="text-rose">
              <Icon icon={CONCERN_LOOK[concerns[0].key].icon} />
            </span>
            For your {new Intl.ListFormat("en", { type: "conjunction" }).format(concerns.map((c) => c.label.toLowerCase()))} today
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs text-ink-muted">
          Step {index + 1} of {total}
        </span>
      </div>
      <div className="mt-3 min-h-0 overflow-y-auto">
        <h1 className="text-lg font-semibold tracking-[-0.01em]">{step.title}</h1>
        <p className="mt-1.5 leading-relaxed text-ink-muted">{step.tip}</p>
        {step.product ? (
          <button
            type="button"
            onClick={() => setShopping(true)}
            aria-label={`Shop ${step.product.brand} ${step.product.name}, ${step.product.shade}`}
            className="mt-3 flex w-full items-center gap-3 rounded-[10px] border border-line bg-surface/70 p-2 pr-3 text-left transition-transform duration-200 active:scale-[0.99] motion-reduce:transition-none"
          >
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#f6f0f2]">
              <ProductPreview step={step} size={44} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] text-ink-muted">
                {step.product.brand}
                {link ? `, at ${link.store}` : ""}
              </span>
              <span className="block truncate text-sm font-medium">{step.product.name}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                <Swatch colors={step.colors} size={10} />
                <span className="truncate">{step.product.shade}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5 text-xs font-medium">
              Shop
              <span className="text-rose">
                <Icon icon={ArrowRight01Icon} />
              </span>
            </span>
          </button>
        ) : (
          // Looks saved before products existed: a plain Amazon search.
          <a
            href={amazonUrl(step)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-rose underline-offset-4"
          >
            <span className="text-rose">
              <Icon icon={ShoppingBag01Icon} />
            </span>
            Find {shopQuery(step)} on Amazon
          </a>
        )}
        {shopping && <ProductSheet step={step} index={index} onClose={() => setShopping(false)} />}
        {error && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[8px] bg-wash px-3 py-2 text-sm" role="alert">
            <span>{error}</span>
            <button type="button" onClick={onRetry} className="shrink-0 font-medium underline decoration-rose underline-offset-4">
              Retry
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 flex shrink-0 gap-2">
        <Button variant="quiet" onClick={onBack} disabled={index === 0} aria-label="Previous step" className="px-4">
          <Icon icon={ArrowLeft01Icon} />
        </Button>
        <Button className="flex-1" onClick={onNext}>
          {last ? "Finish" : "Next step"}
        </Button>
      </div>
    </GlassSheet>
  );
}
