import type { Difficulty } from "@/lib/types";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = { 1: "Low", 2: "Medium", 3: "High" };

/** Difficulty as phone-coverage bars. On photos: white bars with a soft shadow, empty bars invisible. */
export function SignalBars({ level, onPhoto = false, label = false }: { level: Difficulty; onPhoto?: boolean; label?: boolean }) {
  const filled = onPhoto ? "bg-white" : "bg-rose";
  const empty = onPhoto ? "bg-transparent" : "bg-wash";
  return (
    <span className="inline-flex items-center gap-2" role="img" aria-label={`Difficulty: ${DIFFICULTY_LABELS[level].toLowerCase()}`}>
      <span
        className={`inline-flex h-[18px] items-end gap-[3px] ${onPhoto ? "drop-shadow-[0_1px_1.5px_rgb(23_20_26/.28)] drop-shadow-[0_3px_8px_rgb(120_50_80/.22)]" : ""}`}
      >
        {[7, 12, 18].map((h, i) => (
          <i key={h} className={`w-1.5 rounded-[3px] ${i < level ? filled : empty}`} style={{ height: h }} />
        ))}
      </span>
      {label && <span className="text-xs text-ink-muted">{DIFFICULTY_LABELS[level]}</span>}
    </span>
  );
}
