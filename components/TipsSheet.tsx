import { useState } from "react";
import { ArrowLeft01Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { CONCERN_LOOK } from "@/components/concernLook";
import { GlassSheet } from "@/components/GlassSheet";
import { ProductPreview } from "@/components/ProductArt";
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
      {concerns.length > 0 && (
        <span className="mb-3 inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-wash py-1 pr-3 pl-1.5 text-xs font-medium">
          <span className="text-rose">
            <Icon icon={CONCERN_LOOK[concerns[0].key].icon} />
          </span>
          For your {new Intl.ListFormat("en", { type: "conjunction" }).format(concerns.map((c) => c.label.toLowerCase()))} today
        </span>
      )}
      <div className="min-h-0 overflow-y-auto">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold tracking-[-0.01em]">{step.title}</h1>
          {step.product ? (
            <button
              type="button"
              onClick={() => setShopping(true)}
              aria-label={`Shop ${step.product.brand} ${step.product.name}${link ? ` at ${link.store}` : ""}`}
              className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[8px] border border-line bg-[#f6f0f2] transition-transform duration-200 active:scale-95 motion-reduce:transition-none"
            >
              <ProductPreview step={step} size={36} />
            </button>
          ) : (
            // Looks saved before products existed: a plain Amazon search.
            <a
              href={amazonUrl(step)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Find ${shopQuery(step)} on Amazon`}
              className="grid size-10 shrink-0 place-items-center rounded-full bg-wash text-rose"
            >
              <Icon icon={ShoppingBag01Icon} />
            </a>
          )}
        </div>
        <p className="mt-1.5 leading-relaxed text-ink-muted">{step.tip}</p>
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
