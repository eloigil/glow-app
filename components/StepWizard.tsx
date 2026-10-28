import type { MakeupCategory, Step } from "@/lib/types";

const SHORT: Record<MakeupCategory, string> = {
  foundation: "Base",
  concealer: "Conceal",
  contour: "Contour",
  bronzer: "Bronze",
  blush: "Blush",
  highlighter: "Glow",
  eyebrows: "Brows",
  eye_shadow: "Shadow",
  eye_liner: "Liner",
  eyelashes: "Lashes",
  lip_color: "Lips",
};

/** Glass pill across the top of the tutorial: one segment per step, tap to jump. */
export function StepWizard({ steps, current, onSelect }: { steps: Step[]; current: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Tutorial steps" className="glass absolute inset-x-3 top-3 z-10 flex gap-1 rounded-full p-1.5">
      {steps.map((s, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-current={i === current ? "step" : undefined}
          aria-label={`Step ${i + 1}: ${s.title}`}
          className={`h-8 min-w-0 flex-1 truncate rounded-full px-1 text-[11px] font-medium transition-colors ${
            i === current ? "bg-rose text-[#17141a]" : i < current ? "text-ink" : "text-ink-muted"
          }`}
        >
          {SHORT[s.category]}
        </button>
      ))}
    </nav>
  );
}
