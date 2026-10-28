"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { StepWizard } from "@/components/StepWizard";
import { TipsSheet } from "@/components/TipsSheet";
import { useSession } from "@/lib/session";
import { useStepRenders } from "@/lib/useStepRenders";

// spec.md > Tutorial: her face with the layers so far, wizard on top, tips below.
export default function Tutorial() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { session } = useSession();
  const look = session.looks?.find((l) => l.id === session.lookId);
  const { images, errors, placeholder, retry } = useStepRenders(look, session.analysis?.fileId);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!look || !session.photo) router.replace("/");
  }, [look, session.photo, router]);

  const total = look?.steps.length ?? 0;
  const go = useCallback(
    (i: number) => {
      // TODO(slice 4): Finish view with Save instead of returning home.
      if (i >= total) router.push("/");
      else setCurrent(Math.max(0, i));
    },
    [total, router],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(current + 1);
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, go]);

  // Show this step's render, or while it paints, the latest earlier layer (or her bare photo).
  const ready = images[current];
  const shown = ready ?? images.slice(0, current).findLast(Boolean) ?? session.photo;
  // Keep the previous image underneath so the new layer cross-fades in on top of it.
  // (Adjusted during render rather than in an effect, so the fade starts on the same paint.)
  const [layers, setLayers] = useState<string[]>([]);
  if (shown && layers.at(-1) !== shown) setLayers([layers.at(-1) ?? shown, shown]);

  if (!look || !session.photo) return null;
  const step = look.steps[current];
  const concern = session.analysis?.concerns.find((c) => c.key === step.corrects);

  return (
    <div className="relative flex-1 overflow-hidden">
      <StepWizard steps={look.steps} current={current} onSelect={go} />

      <motion.div
        className="absolute inset-x-0 top-0 h-[60%] touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) go(current + 1);
          else if (info.offset.x > 60) go(current - 1);
        }}
      >
        {layers.map((src, i) => (
          <motion.img
            key={src + i}
            src={src}
            alt={i === layers.length - 1 ? `Your face after: ${step.title}` : ""}
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
            initial={i === layers.length - 1 && !reduce ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        {!ready && (
          <div className="shimmer absolute inset-0 grid place-items-end justify-center pb-16" role="status">
            <span className="glass rounded-full px-3 py-1 text-xs font-medium">Painting this step</span>
          </div>
        )}
        {placeholder && (
          <span className="absolute top-16 right-3 rounded-full bg-[#17141a]/50 px-2 py-0.5 text-[10px] text-[#fdfcfd]">replay</span>
        )}
      </motion.div>

      <TipsSheet
        step={step}
        index={current}
        total={total}
        concern={concern}
        error={errors[current]}
        onRetry={() => retry(current)}
        onBack={() => go(current - 1)}
        onNext={() => go(current + 1)}
      />
    </div>
  );
}
