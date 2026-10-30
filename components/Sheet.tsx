"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Bottom sheet that slides up on open and back down on dismiss. Native <dialog> gives the focus trap and Escape
 * for free. `children` gets `dismiss`, so buttons inside can close it with the same slide.
 */
export function Sheet({
  labelledBy,
  onClose,
  children,
}: {
  labelledBy: string;
  onClose: () => void;
  children: (dismiss: () => void) => ReactNode;
}) {
  // The element in state, not a ref: `dismiss` is handed to children during render.
  const [d, setD] = useState<HTMLDialogElement | null>(null);
  useEffect(() => {
    d?.showModal();
  }, [d]);
  // Slide back down before closing; without motion (or animations) the close is immediate.
  const dismiss = () => {
    if (!d || d.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return d.close();
    d.setAttribute("data-closing", "");
    const finish = () => {
      d.removeEventListener("animationend", done);
      clearTimeout(fallback);
      d.removeAttribute("data-closing");
      d.close();
    };
    const done = (e: AnimationEvent) => {
      if (e.target === d) finish(); // ignore animations bubbling up from inside the sheet
    };
    // Never let closing depend on the animation actually running (e.g. stale CSS): close after it would have ended.
    const fallback = setTimeout(finish, 320);
    d.addEventListener("animationend", done);
  };

  return (
    <dialog
      ref={setD}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={(e) => (e.preventDefault(), dismiss())}
      // A click on the dialog itself (not its content) is a backdrop tap.
      onClick={(e) => e.target === d && dismiss()}
      className="sheet-dialog fixed inset-x-0 top-auto bottom-0 mx-auto mb-0 w-full max-w-[430px] rounded-t-[14px] bg-surface p-0 text-ink backdrop:bg-[#17141a]/40"
    >
      <div className="px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]">{children(dismiss)}</div>
    </dialog>
  );
}
