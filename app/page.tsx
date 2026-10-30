import Image from "next/image";
import Link from "next/link";
import { Bookmark02Icon } from "@hugeicons/core-free-icons";
import { buttonClass } from "@/components/Button";
import { Icon } from "@/components/Icon";
import poster from "@/public/welcome-poster.jpg";

export default function Welcome() {
  return (
    <div className="relative flex min-h-dvh flex-1 flex-col overflow-hidden">
      {/* The video's first look as a still: paints instantly, and stays as the background with reduced motion. */}
      <Image src={poster} alt="" fill priority sizes="430px" className="object-cover saturate-[1.35]" placeholder="blur" />
      <video
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 size-full object-cover saturate-[1.35] motion-reduce:hidden"
      >
        <source src="/welcome.mp4" type="video/mp4" />
      </video>
      <Link
        href="/saved"
        aria-label="Saved looks"
        className="glass absolute top-4 right-4 z-10 grid size-10 place-items-center rounded-full text-ink"
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
