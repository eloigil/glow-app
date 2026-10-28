import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/** Hugeicons wrapper: 24px in lists and cards, 28px for primary actions. */
export function Icon({ icon, size = 24, className = "" }: { icon: IconSvgElement; size?: 24 | 28; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} color="currentColor" className={`shrink-0 ${className}`} aria-hidden />;
}
