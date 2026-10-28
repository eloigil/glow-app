"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DropletIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { ConcernCard } from "@/components/ConcernCard";
import { CONCERN_LOOK } from "@/components/concernLook";
import { GlassSheet } from "@/components/GlassSheet";
import { Icon } from "@/components/Icon";
import { MaskHighlight } from "@/components/MaskHighlight";
import { useSession } from "@/lib/session";
import type { ConcernKey } from "@/lib/types";

export default function SkinAnalysis() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const [active, setActive] = useState<ConcernKey>();
  const { photo, analysis, tone } = session;

  useEffect(() => {
    if (!analysis) router.replace("/");
  }, [analysis, router]);
  if (!analysis || !photo) return null;

  const points = analysis.concerns.filter((c) => c.isPoint);

  const activeMask = points.find((c) => c.key === active)?.mask;

  return (
    <div className="relative flex-1 overflow-hidden">
      {/* The face keeps the top of the screen; the sheet only overlaps its bottom edge. */}
      <div className="absolute inset-x-0 top-0 h-[58%]">
        {/* eslint-disable-next-line @next/next/no-img-element -- object/data URL */}
        <img src={photo} alt="Your photo" className="absolute inset-0 size-full object-cover" />
        {activeMask && <MaskHighlight mask={activeMask} />}
      </div>

      <GlassSheet className="flex max-h-[50%] flex-col">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-lg font-bold tracking-[-0.02em]">Your skin today</h1>
          {tone && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-wash py-1 pr-3 pl-1.5 text-xs font-medium">
              <span className="size-4 rounded-full border border-white/70" style={{ background: tone.skinHex }} />
              <span className="text-rose">
                <Icon icon={DropletIcon} size={24} />
              </span>
              {tone.label}
            </span>
          )}
        </div>

        {points.length > 0 ? (
          <div className="min-h-0 overflow-y-auto">
            <p className="mt-4 mb-2 text-sm text-ink-muted">Today&apos;s focus</p>
            <div className="grid gap-2">
              {points.map((c) => (
                <ConcernCard
                  key={c.key}
                  icon={CONCERN_LOOK[c.key].icon}
                  label={c.label}
                  hint={CONCERN_LOOK[c.key].hint}
                  active={c.key === active}
                  onClick={() => setActive(c.key === active ? undefined : c.key)}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 text-ink-muted">Your skin looks great today. Let&apos;s find a look for it.</p>
        )}

        <Button
          className="mt-5 w-full shrink-0"
          onClick={() => {
            setSession((s) => ({ ...s, looks: undefined, lookId: undefined }));
            router.push("/looks");
          }}
        >
          Continue
        </Button>
      </GlassSheet>
    </div>
  );
}
