"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft01Icon, Bookmark02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { SignalBars } from "@/components/SignalBars";
import { listSaved, type SavedLook } from "@/lib/saved";
import { useSession } from "@/lib/session";

type Item = SavedLook & { thumb: string };

// spec.md > Saved Looks: everything comes from IndexedDB, so replay makes no network calls.
export default function SavedLooks() {
  const router = useRouter();
  const { setSession } = useSession();
  const [items, setItems] = useState<Item[]>();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let urls: string[] = [];
    listSaved()
      .then((saved) => {
        const list = saved.map((s) => ({ ...s, thumb: URL.createObjectURL(s.steps.at(-1) ?? s.original) }));
        urls = list.map((i) => i.thumb);
        setItems(list);
      })
      .catch(() => setFailed(true));
    return () => urls.forEach(URL.revokeObjectURL);
  }, []);

  function open(s: SavedLook) {
    // ponytail: these object URLs live until the tab closes; revoke on session change if memory ever matters.
    const toUrl = (b: Blob) => URL.createObjectURL(b);
    setSession({
      photo: toUrl(s.original),
      analysis: { fileId: "", concerns: s.concerns },
      looks: [s.look],
      lookId: s.look.id,
      stepImages: { [s.look.id]: s.steps.map(toUrl) },
      savedId: s.id,
    });
    router.push("/tutorial");
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-6 pb-8">
      <Link href="/" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
        <Icon icon={ArrowLeft01Icon} size={24} />
      </Link>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em]">Saved looks</h1>

      {failed && (
        <p className="mt-6 rounded-[8px] bg-wash px-3 py-2 text-sm" role="alert">
          We couldn&apos;t open your saved looks on this device.
        </p>
      )}

      {items?.length ? (
        <ul className="mt-6 grid gap-3">
          {items.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => open(s)}
                className="flex w-full items-center gap-4 rounded-[10px] border border-line bg-surface p-2 text-left motion-safe:active:scale-[.99]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL */}
                <img src={s.thumb} alt="" className="h-20 w-16 shrink-0 rounded-[8px] object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{s.look.name}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {new Date(s.savedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                </span>
                <span className="pr-2">
                  <SignalBars level={s.look.difficulty} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        items && (
          <div className="mt-16 flex flex-col items-center text-center">
            <span className="grid size-16 place-items-center rounded-[10px] border border-line bg-surface text-rose">
              <Icon icon={Bookmark02Icon} size={28} />
            </span>
            <p className="mt-4 font-medium">No saved looks yet</p>
            <p className="mt-1 max-w-[30ch] text-sm text-ink-muted">Finish a tutorial and tap Save to keep it here.</p>
            <Link href="/photo" className="mt-4 text-sm font-medium text-rose underline underline-offset-4">
              Start a look
            </Link>
          </div>
        )
      )}
    </div>
  );
}
