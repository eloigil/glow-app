"use client";

import { motion, useReducedMotion } from "motion/react";

/** A soft light band sweeping down the photo while YouCam works. */
export function ScanSweep() {
  const reduce = useReducedMotion();
  if (reduce) return <div className="pointer-events-none absolute inset-0 bg-white/20" aria-hidden />;
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 h-28 bg-gradient-to-b from-transparent via-white/60 to-transparent"
      initial={{ top: "-7rem" }}
      animate={{ top: "100%" }}
      transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
    />
  );
}
