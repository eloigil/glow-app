import Image from "next/image";
import Link from "next/link";
import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { buttonClass } from "@/components/Button";
import { Icon } from "@/components/Icon";
import welcome from "@/public/welcome-bubbles.jpg";

export default function Welcome() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      <Image src={welcome} alt="" fill priority sizes="430px" className="object-cover object-[40%_center]" placeholder="blur" />
      <Link
        href="/saved"
        aria-label="Saved looks"
        className="glass absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full text-[#17141a]"
      >
        <Icon icon={Bookmark02Icon} size={24} />
      </Link>
      <div className="relative mt-auto px-6 pb-[max(32px,env(safe-area-inset-bottom))]">
        <h1 className="font-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-[#17141a]">
          Makeup made for today&apos;s skin
        </h1>
        <Link href="/photo" className={buttonClass("ink", "mt-7 w-full")}>
          Start
        </Link>
      </div>
    </div>
  );
}
