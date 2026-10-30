import { HugeiconsIcon } from "@hugeicons/react";
import { BlushBrush01Icon } from "@hugeicons/core-free-icons";

/** Loading state for a layer being painted: a brush dips into a powder pot, then sweeps. */
export function MakeupLoader({ label }: { label: string }) {
  return (
    <div className="glass flex items-center gap-3 rounded-[14px] py-3 pr-4 pl-3" role="status">
      <div className="relative h-11 w-12 shrink-0" aria-hidden>
        <svg viewBox="0 0 48 20" className="absolute inset-x-0 bottom-0 w-full">
          <ellipse cx="24" cy="12" rx="20" ry="7" className="fill-ink/15" />
          <ellipse cx="24" cy="9" rx="20" ry="7" className="fill-surface stroke-line" strokeWidth="1" />
          <ellipse cx="24" cy="9" rx="14" ry="4.5" className="fill-rose" />
        </svg>
        <span className="brush-dip absolute -top-1 left-1/2 text-ink">
          <HugeiconsIcon icon={BlushBrush01Icon} size={28} color="currentColor" />
        </span>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
