"use client";

import { useEffect, useState } from "react";
import { BookmarkAdd02Icon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { GlassSheet } from "@/components/GlassSheet";
import { Icon } from "@/components/Icon";
import { SignalBars } from "@/components/SignalBars";
import { isSaved, saveLook } from "@/lib/saved";
import type { Concern, Look } from "@/lib/types";

type State = "idle" | "saving" | "saved" | "error";

/** spec.md > Tutorial (Finish view): her finished face, Save to the device, Finish. */
export function FinishView({
  look,
  saveId,
  photo,
  images,
  placeholders,
  errors,
  onRetry,
  onBack,
  concerns,
  onFinish,
}: {
  look: Look;
  /** Stable per photo + look, so saving twice overwrites instead of duplicating. */
  saveId: string;
  photo: string;
  images: (string | undefined)[];
  /** Per step: the image is a replay stand-in, not a real render. */
  placeholders: boolean[];
  errors: (string | undefined)[];
  onRetry: (step: number) => void;
  /** Back to the last step (clears the finished state). */
  onBack: () => void;
  concerns: Concern[];
  onFinish: () => void;
}) {
  const [state, setState] = useState<State>("idle");
  const complete = look.steps.every((_, i) => images[i]);
  const failed = look.steps.map((_, i) => i).filter((i) => errors[i] && !images[i]);
  const standIn = look.steps.some((_, i) => placeholders[i]);
  const finished = images[look.steps.length - 1] ?? images.findLast(Boolean) ?? photo;

  useEffect(() => {
    isSaved(saveId).then((yes) => yes && setState("saved")).catch(() => {});
  }, [saveId]);

  async function save() {
    setState("saving");
    try {
      await saveLook(saveId, look, concerns, photo, images as string[]);
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[64%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- data/object URL */}
        <img src={finished} alt={`Your face with the full ${look.name} look`} className="absolute inset-0 size-full object-cover" />
      </div>

      <GlassSheet>
        <h1 className="font-display text-xl font-bold tracking-[-0.02em]">Your look is ready</h1>
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="font-medium">{look.name}</p>
          <SignalBars level={look.difficulty} label />
        </div>
        <p className="sr-only" role="status">
          {state === "saved" ? "Look saved" : state === "error" ? "We couldn't save this on your device. Try again." : ""}
        </p>
        {state === "error" && (
          <p className="mt-3 rounded-[8px] bg-wash px-3 py-2 text-sm">We couldn&apos;t save this on your device. Try again.</p>
        )}
        {failed.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-[8px] bg-wash px-3 py-2 text-sm">
            <p>One layer didn&apos;t finish.</p>
            <Button variant="quiet" onClick={() => failed.forEach(onRetry)}>
              Retry
            </Button>
          </div>
        )}
        {complete && standIn && <p className="mt-3 text-sm text-ink-muted">Some layers are replay previews.</p>}
        <div className="mt-5 grid gap-2">
          <Button onClick={save} disabled={!complete || state === "saving" || state === "saved"}>
            {state === "saved" ? (
              <>
                <Icon icon={CheckmarkCircle02Icon} size={28} /> Saved
              </>
            ) : !complete ? (
              "Finishing your layers"
            ) : (
              <>
                <Icon icon={BookmarkAdd02Icon} size={28} /> {state === "saving" ? "Saving" : standIn ? "Save preview" : "Save look"}
              </>
            )}
          </Button>
          <Button variant="quiet" onClick={onBack}>
            Back to steps
          </Button>
          <Button variant="quiet" onClick={onFinish}>
            Finish
          </Button>
        </div>
      </GlassSheet>
    </div>
  );
}
