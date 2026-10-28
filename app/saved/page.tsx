import Link from "next/link";
import { ArrowLeft01Icon, Bookmark02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

// Stub until slice 4 stores looks on the device.
export default function SavedLooks() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-6">
      <Link href="/" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
        <Icon icon={ArrowLeft01Icon} size={24} />
      </Link>
      <h1 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em]">Saved looks</h1>
      <div className="mt-16 flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-[10px] border border-line bg-surface text-rose">
          <Icon icon={Bookmark02Icon} size={28} />
        </span>
        <p className="mt-4 font-medium">No saved looks yet</p>
        <p className="mt-1 max-w-[30ch] text-sm text-ink-muted">Finish a tutorial and tap Save to keep it here.</p>
      </div>
    </div>
  );
}
