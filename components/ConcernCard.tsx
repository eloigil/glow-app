"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "@/components/Icon";
import type { IconSvgElement } from "@hugeicons/react";

export function ConcernCard({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`glass relative flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-left transition-colors ${active ? "ring-2 ring-rose" : ""}`}
      // A short shadow: the list scrolls, and a scroll area cuts off glass's tall default shadow at its edges.
      style={{ boxShadow: "inset 0 1px 0 var(--glass-edge), 0 2px 8px rgb(120 50 80 / 0.08)" }}
    >
      {active && !reduce && (
        // One-shot ring pulse when the card becomes active.
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[10px]"
          initial={{ boxShadow: "0 0 0 0 rgb(236 148 176 / .6)" }}
          animate={{ boxShadow: "0 0 0 12px rgb(236 148 176 / 0)" }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      )}
      <span className="text-rose">
        <Icon icon={icon} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
    </button>
  );
}
