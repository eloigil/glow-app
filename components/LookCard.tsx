"use client";

import { motion, useReducedMotion } from "motion/react";
import { BlushBrush01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { SignalBars } from "@/components/SignalBars";
import type { Look } from "@/lib/types";

type Preview = { image?: string; standIn: boolean; error?: string; retry: () => void };

/** A look in the grid. Tapped, it grows in place across both columns with its description and Start makeup. */
export function LookCard({ look, preview, grown, onGrow, onStart }: {
  look: Look;
  preview: Preview;
  grown: boolean;
  onGrow: () => void;
  onStart: () => void;
}) {
  const reduce = useReducedMotion();
  const face = (
    <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] face-placeholder">
      {preview.image ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL render
        <img src={preview.image} alt={`Preview of ${look.name}`} className="absolute inset-0 size-full object-cover" />
      ) : (
        !preview.error && <div className="shimmer absolute inset-0" role="status" aria-label="Painting this look" />
      )}
      {preview.error && (
        <div className="absolute inset-0 grid place-items-center p-3 text-center">
          <button type="button" onClick={(e) => (e.stopPropagation(), preview.retry())} className="glass rounded-full px-3 py-1.5 text-xs font-medium">
            Retry
          </button>
        </div>
      )}
      {!grown && (
        <span className="absolute bottom-3 left-3">
          <SignalBars level={look.difficulty} onPhoto />
        </span>
      )}
      {preview.standIn && (
        <span className="absolute top-2 right-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] text-canvas">replay</span>
      )}
    </div>
  );

  return (
    <motion.div
      layout
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
      className={grown ? "col-span-2 rounded-[10px] bg-surface p-2 shadow-[0_10px_30px_rgb(120_50_80/.10)]" : ""}
    >
      {grown ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <motion.div layout="position">{face}</motion.div>
            <div className="pt-1">
              <h2 className="font-display text-[15px] leading-tight font-bold tracking-[-0.02em]">{look.name}</h2>
              <p className="mt-1.5 text-[13px] leading-snug text-ink-muted">{look.description}</p>
              <div className="mt-3">
                <SignalBars level={look.difficulty} label />
              </div>
            </div>
          </div>
          <Button className="mt-3 w-full" onClick={onStart}>
            Start makeup <Icon icon={BlushBrush01Icon} size={28} />
          </Button>
        </>
      ) : (
        <button type="button" onClick={onGrow} aria-expanded={false} aria-label={`${look.name}, show details`} className="block w-full text-left">
          {face}
        </button>
      )}
    </motion.div>
  );
}
