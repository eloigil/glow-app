"use client";

import { useEffect, useRef, useState } from "react";
import { LinkSquare02Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { Button, buttonClass } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { ProductPreview } from "@/components/ProductArt";
import { Swatch } from "@/components/ProductCarousel";
import { useSession } from "@/lib/session";
import { amazonUrl } from "@/lib/shop";
import { linkFor } from "@/lib/useProductLinks";
import type { Step } from "@/lib/types";

/** Bottom sheet with one suggested product. Native <dialog> gives the focus trap and Escape for free. */
export function ProductSheet({ step, index, onClose }: { step: Step; index: number; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const { brand, name, shade } = step.product;
  const [photo, setPhoto] = useState(false);
  const { session } = useSession();
  const link = linkFor(session, step);
  const amazon = (
    <a href={amazonUrl(step)} target="_blank" rel="noopener noreferrer" className={buttonClass(link === null ? "primary" : "quiet", "w-full")}>
      <Icon icon={ShoppingBag01Icon} size={28} /> Shop on Amazon
    </a>
  );

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
        <div className="mx-auto grid h-[140px] w-[140px] place-items-center overflow-hidden rounded-[10px] border border-line bg-white">
          <ProductPreview step={step} size={96} onPhoto={setPhoto} />
        </div>
        {photo && <p className="mt-1 text-center text-[10px] text-ink-muted">Photo: Open Beauty Facts</p>}
        <div className="mt-4 min-w-0">
          <p className="text-sm text-ink-muted">{brand}</p>
          <h2 id="product-name" className="font-semibold leading-snug">{name}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm">
            <Swatch colors={step.colors} size={16} /> Shade: {shade}
          </p>
        </div>
        <p className="mt-4 text-sm text-ink-muted">
          For step {index + 1}, {step.title}
        </p>
        <div className="mt-5 grid gap-2">
          {link ? (
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "w-full")}>
              <Icon icon={LinkSquare02Icon} size={28} /> View at {link.store}
            </a>
          ) : (
            link === undefined && (
              <Button disabled aria-busy className="w-full">
                <span aria-hidden className="size-4 rounded-full border-2 border-ink/25 border-t-ink motion-safe:animate-spin" />
                Finding the product page
              </Button>
            )
          )}
          {amazon}
          <Button variant="quiet" onClick={() => ref.current?.close()}>
            Close
          </Button>
        </div>
        <p className="mt-3 text-center text-xs text-ink-muted">
          {link ? "Exact page found by web search. Amazon shows the closest listings." : "Suggested match. Amazon shows the closest listings."}
        </p>
      </div>
    </dialog>
  );
}
