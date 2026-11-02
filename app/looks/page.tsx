"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGroup } from "motion/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { CopyCard } from "@/components/CopyCard";
import { LookCard } from "@/components/LookCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { postJson } from "@/lib/postJson";
import { useSession } from "@/lib/session";
import type { LooksResponse } from "@/lib/types";
import { useProductLinks } from "@/lib/useProductLinks";
import { resetRenders, useLookPreviews } from "@/lib/useStepRenders";

// Survives leaving /looks: one request per photo even if she goes Back and Continues mid-generation.
const inflight = new Map<string, Promise<void>>();

// spec.md > Your Looks: six previews of her face; the tapped one grows in place.
export default function Looks() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const { looks, analysis, tone } = session;
  const previews = useLookPreviews(looks, analysis?.fileId);
  useProductLinks(looks, analysis?.fileId);
  const [grownId, setGrownId] = useState<string>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!analysis) {
      router.replace("/");
      return;
    }
    if (looks?.length) return;
    const { fileId } = analysis;
    let p = inflight.get(fileId);
    if (!p) {
      p = postJson<LooksResponse>("/api/looks", { concerns: analysis.concerns, skinType: analysis.skinType, tone })
        .then((body) => {
          if (!body.looks?.length) throw new Error("We couldn't design looks this time. Try again.");
          resetRenders(fileId);
          setSession((s) =>
            s.analysis?.fileId === fileId
              ? { ...s, looks: body.looks, looksFor: fileId, lookId: undefined, stepImages: {}, stepPlaceholders: {}, stepErrors: {}, copies: {} }
              : s,
          );
        })
        .finally(() => inflight.delete(fileId));
      inflight.set(fileId, p);
    }
    p.catch((e: Error) => setError(e.message));
  }, [analysis, looks, tone, attempt, router, setSession]);
  if (!analysis) return null;

  // Cards keep their order; the grown card spans both columns where it is and `grid-flow-row-dense` backfills the gap.
  const order = (looks ?? []).map((l, i) => ({ look: l, preview: previews[i] }));

  return (
    <div className="flex-1 px-3 pt-5 pb-8">
      <div className="flex items-center gap-2 px-1">
        <Link href="/analysis" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
          <Icon icon={ArrowLeft01Icon} size={24} />
        </Link>
        <h1 className="flex-1 font-display text-lg font-bold tracking-[-0.02em]">Six looks for you</h1>
        <ThemeToggle />
      </div>
      {!looks?.length && (
        <div className="mt-3 px-1 text-sm text-ink-muted" aria-live="polite">
          {error ? (
            <div className="flex items-center gap-3" role="alert">
              <p className="min-w-0 flex-1 text-ink">{error}</p>
              <Button className="shrink-0 !px-5 !py-2.5" onClick={() => (setError(undefined), setAttempt((n) => n + 1))}>
                Retry
              </Button>
            </div>
          ) : (
            <>
              <p className="font-medium text-ink">Designing six looks for your skin</p>
              <p className="mt-0.5">This can take up to a minute while every shade is matched to your skin.</p>
            </>
          )}
        </div>
      )}
      <LayoutGroup>
        <div className="mt-4 grid grid-flow-row-dense grid-cols-2 gap-2.5">
          {looks?.length
            ? order.map(({ look, preview }) => (
                <LookCard
                  key={look.id}
                  look={look}
                  preview={preview}
                  inspiration={session.copies?.[look.id]?.inspiration}
                  grown={look.id === grownId}
                  onGrow={() => setGrownId(look.id)}
                  onStart={() => {
                    setSession((s) => ({ ...s, lookId: look.id }));
                    router.push("/tutorial");
                  }}
                />
              ))
            : Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="face-placeholder relative aspect-[3/4] overflow-hidden rounded-[10px]" aria-hidden>
                  {!error && <div className="shimmer absolute inset-0" />}
                </div>
              ))}
          {!!looks?.length && <CopyCard onCopied={setGrownId} />}
        </div>
      </LayoutGroup>
    </div>
  );
}
