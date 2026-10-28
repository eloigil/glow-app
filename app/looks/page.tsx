import Link from "next/link";
import { ArrowLeft01Icon, Bookmark02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

// Stub until the looks slice replaces it.
export default function Looks() {
  return (
    <div className="flex flex-1 flex-col px-6 pt-6">
      <Link href="/analysis" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
        <Icon icon={ArrowLeft01Icon} size={24} />
      </Link>
      <div className="mt-16 flex flex-col items-center text-center">
        <span className="grid size-16 place-items-center rounded-[10px] border border-line bg-surface text-rose">
          <Icon icon={Bookmark02Icon} size={28} />
        </span>
        <p className="mt-4 font-medium">Your looks are on the way.</p>
      </div>
    </div>
  );
}
