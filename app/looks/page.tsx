"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGroup } from "motion/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { LookCard } from "@/components/LookCard";
import { useSession } from "@/lib/session";
import { useLookPreviews } from "@/lib/useStepRenders";

// spec.md > Your Looks: five previews of her face; the tapped one grows in place.
export default function Looks() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const { looks, analysis } = session;
  const previews = useLookPreviews(looks, analysis?.fileId);
  const [grownId, setGrownId] = useState<string>();

  useEffect(() => {
    if (!looks?.length || !analysis) router.replace("/");
  }, [looks, analysis, router]);
  if (!looks?.length || !analysis) return null;

  // The grown card moves to the top so it spans the full first row.
  const order = looks.map((l, i) => ({ look: l, preview: previews[i] })).sort((a, b) => Number(b.look.id === grownId) - Number(a.look.id === grownId));

  return (
    <div className="flex-1 px-3 pt-5 pb-8">
      <div className="flex items-center gap-2 px-1">
        <Link href="/analysis" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
          <Icon icon={ArrowLeft01Icon} size={24} />
        </Link>
        <h1 className="font-display text-lg font-bold tracking-[-0.02em]">Five looks for today</h1>
      </div>
      <LayoutGroup>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {order.map(({ look, preview }) => (
            <LookCard
              key={look.id}
              look={look}
              preview={preview}
              grown={look.id === grownId}
              onGrow={() => setGrownId(look.id)}
              onStart={() => {
                setSession((s) => ({ ...s, lookId: look.id }));
                router.push("/tutorial");
              }}
            />
          ))}
        </div>
      </LayoutGroup>
    </div>
  );
}
