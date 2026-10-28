import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { CONCERN_LOOK } from "@/components/concernLook";
import { GlassSheet } from "@/components/GlassSheet";
import { Icon } from "@/components/Icon";
import type { Concern, Step } from "@/lib/types";

/** Glass sheet under the face: what this step applies, why today, how to do it. */
export function TipsSheet({
  step,
  index,
  total,
  concerns,
  error,
  onRetry,
  onBack,
  onNext,
}: {
  step: Step;
  index: number;
  total: number;
  concerns: Concern[];
  error?: string;
  onRetry: () => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const last = index === total - 1;
  return (
    <GlassSheet className="flex max-h-[46%] flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3">
        {concerns.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-wash py-1 pr-3 pl-1.5 text-xs font-medium">
            <span className="text-rose">
              <Icon icon={CONCERN_LOOK[concerns[0].key].icon} />
            </span>
            For your {new Intl.ListFormat("en", { type: "conjunction" }).format(concerns.map((c) => c.label.toLowerCase()))} today
          </span>
        ) : (
          <span />
        )}
        <span className="text-xs text-ink-muted">
          Step {index + 1} of {total}
        </span>
      </div>
      <div className="mt-3 min-h-0 overflow-y-auto">
        <h1 className="text-lg font-semibold tracking-[-0.01em]">{step.title}</h1>
        <p className="mt-1.5 leading-relaxed text-ink-muted">{step.tip}</p>
        {error && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[8px] bg-wash px-3 py-2 text-sm" role="alert">
            <span>{error}</span>
            <button type="button" onClick={onRetry} className="shrink-0 font-medium underline decoration-rose underline-offset-4">
              Retry
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 flex shrink-0 gap-2">
        <Button variant="quiet" onClick={onBack} disabled={index === 0} aria-label="Previous step" className="px-4">
          <Icon icon={ArrowLeft01Icon} />
        </Button>
        <Button className="flex-1" onClick={onNext}>
          {last ? "Finish" : "Next step"}
        </Button>
      </div>
    </GlassSheet>
  );
}
