"use client";

import { useEffect, useRef } from "react";
import { ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Button, buttonClass } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Swatch } from "@/components/ProductCarousel";
import { amazonUrl } from "@/lib/shop";
import type { Step } from "@/lib/types";

/** Bottom sheet with one suggested product. Native <dialog> gives the focus trap and Escape for free. */
export function ProductSheet({ step, index, onClose }: { step: Step; index: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const { brand, name, shade } = step.product;

  return (
    <dialog
      ref={ref}
      aria-labelledby="product-name"
      onClose={onClose}
      // A click on the dialog itself (not its content) is a backdrop tap.
      onClick={(e) => e.target === ref.current && ref.current.close()}
      className="fixed inset-x-0 top-auto bottom-0 mx-auto mb-0 w-full max-w-[430px] rounded-t-[14px] bg-surface p-0 text-ink backdrop:bg-[#17141a]/40"
    >
      <div className="px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-4">
          <Swatch colors={step.colors} size={56} />
          <div className="min-w-0">
            <p className="text-sm text-ink-muted">{brand}</p>
            <h2 id="product-name" className="font-semibold leading-snug">{name}</h2>
            <p className="mt-0.5 text-sm">Shade: {shade}</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          For step {index + 1}, {step.title}
        </p>
        <div className="mt-5 grid gap-2">
          <a href={amazonUrl(step)} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "w-full")}>
            <Icon icon={ShoppingBag01Icon} size={28} /> Shop on Amazon
          </a>
          <Button variant="quiet" onClick={() => ref.current?.close()}>
            Close
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-muted">Suggested match. Amazon shows the closest listings.</p>
      </div>
    </dialog>
  );
}
