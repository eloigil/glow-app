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

/**
 * Progress across the top of the tutorial, story-style: one bar per step (done, current, still to come),
 * tap a bar to jump, and a glass chip naming where she is. Bars of layers still being painted shimmer.
 */
export function StepWizard({
  steps,
  current,
  ready,
  onSelect,
}: {
  steps: Step[];
  current: number;
  /** Whether each step's layer has been painted yet. */
  ready: boolean[];
  onSelect: (i: number) => void;
}) {
  return (
    <nav aria-label="Tutorial steps" className="absolute inset-x-3 top-2 z-10">
      <ol className="flex gap-1">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "current" : "next";
          return (
            <li key={i} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-current={state === "current" ? "step" : undefined}
                aria-label={`Step ${i + 1} of ${steps.length}: ${s.title}`}
                className="block w-full py-2.5"
              >
                <span className="relative block h-1 overflow-hidden rounded-full bg-white/40 shadow-[0_1px_3px_rgb(23_20_26/0.25)]">
                  <span
                    className={`absolute inset-0 rounded-full transition-[transform,background-color] duration-300 ease-out motion-reduce:transition-none ${
                      state === "current" ? "bg-rose" : "bg-white"
                    }`}
                    style={{ transform: `scaleX(${state === "next" ? 0 : 1})`, transformOrigin: "left" }}
                  />
                  {!ready[i] && <span className="shimmer absolute inset-0" />}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="glass mt-0.5 inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium" aria-live="polite">
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11px] text-[#17141a] tabular-nums">
          {current + 1}/{steps.length}
        </span>
        {SHORT[steps[current].category]}
      </p>
    </nav>
  );
}
