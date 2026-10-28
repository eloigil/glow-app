"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Tints the area a YouCam concern mask marks, on top of an object-cover photo.
 * PNG masks are read by alpha; opaque JPG masks (white on black) by luminance.
 */
export function MaskHighlight({ mask }: { mask: string }) {
  const reduce = useReducedMotion();
  const mode = mask.startsWith("data:image/png") ? "alpha" : "luminance";
  const style = {
    maskImage: `url("${mask}")`,
    WebkitMaskImage: `url("${mask}")`,
    maskMode: mode,
    maskSize: "cover",
    WebkitMaskSize: "cover",
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
  } as const;
  // YouCam masks are sparse, soft dots. A light scrim plus a glowing fill keeps them readable on any skin:
  // the glow lives on a wrapper because CSS applies filters before masks.
  return (
    <motion.div
      key={mask}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={reduce ? { opacity: 1 } : { opacity: [0, 1, 0.85, 1] }}
      transition={reduce ? { duration: 0 } : { duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 bg-[#17141a]/30" />
      <div className="absolute inset-0" style={{ filter: "drop-shadow(0 0 4px #ec94b0) drop-shadow(0 0 10px #ec94b0)" }}>
        <div className="absolute inset-0 bg-[#fff4f7]" style={style} />
        <div className="absolute inset-0 bg-[#fff4f7]" style={style} />
      </div>
    </motion.div>
  );
}
