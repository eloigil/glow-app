"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Every Motion layout and transition in the app honors the OS reduced-motion setting. */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
