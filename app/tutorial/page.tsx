"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { FinishView } from "@/components/FinishView";
import { MakeupLoader } from "@/components/MakeupLoader";
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
  const { images, placeholders, errors, retry } = useStepRenders(look, session.analysis?.fileId);
  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!look || !session.photo) router.replace("/");
  }, [look, session.photo, router]);

  const total = look?.steps.length ?? 0;
  const go = useCallback(
    (i: number) => setCurrent(Math.max(0, Math.min(i, total - 1))),
    [total],
  );
  const next = useCallback(() => (current >= total - 1 ? setFinished(true) : go(current + 1)), [current, total, go]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") go(current - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, go, next]);

  // Show this step's render, or while it paints, the latest earlier layer (or her bare photo).
  const ready = images[current];
  const shownIndex = ready ? current : images.slice(0, current).findLastIndex(Boolean);
  const shown = (shownIndex >= 0 ? images[shownIndex] : undefined) ?? session.photo;
  const standIn = shownIndex >= 0 && placeholders[shownIndex];
  // Keep the previous image underneath so the new layer cross-fades in on top of it.
  // (Adjusted during render rather than in an effect, so the fade starts on the same paint.)
  const [layers, setLayers] = useState<string[]>([]);
  if (shown && layers.at(-1) !== shown) setLayers(layers.length ? [layers.at(-1)!, shown] : [shown]);

  if (!look || !session.photo) return null;
  const step = look.steps[current];
  const fixes = session.analysis?.concerns.filter((c) => step.corrects.includes(c.key)) ?? [];

  if (finished) {
    return (
      <FinishView
        look={look}
        saveId={session.savedId ?? `${session.analysis?.fileId}:${look.id}`}
        photo={session.photo}
        images={images}
        placeholders={placeholders}
        errors={errors}
        onRetry={retry}
        onBack={() => setFinished(false)}
        concerns={session.analysis?.concerns ?? []}
        onFinish={() => router.push(session.savedId ? "/saved" : "/")}
      />
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <StepWizard steps={look.steps} current={current} ready={look.steps.map((_, i) => !!images[i])} onSelect={go} />

      <motion.div
        className="absolute inset-x-0 top-0 h-[60%] touch-pan-y"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => {
          if (info.offset.x < -60) next();
          else if (info.offset.x > 60) go(current - 1);
        }}
      >
        {layers.map((src, i) => (
          <motion.img
            key={src}
            src={src}
            alt={i < layers.length - 1 ? "" : ready ? `Your face after: ${step.title}` : `Your face, painting ${step.title}`}
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full object-cover"
            initial={i === layers.length - 1 && i > 0 && !reduce ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        ))}
        {!ready && !errors[current] && (
          <div className="absolute inset-0 grid place-items-end justify-center bg-ink/10 pb-16">
            <MakeupLoader label="Painting this step" />
          </div>
        )}
        {standIn && (
          <span className="absolute top-16 right-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] text-canvas">replay</span>
        )}
      </motion.div>

      <TipsSheet
        step={step}
        index={current}
        total={total}
        concerns={fixes}
        error={errors[current]}
        onRetry={() => retry(current)}
        onBack={() => go(current - 1)}
        onNext={next}
      />
    </div>
  );
}
