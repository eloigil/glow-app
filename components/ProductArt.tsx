"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { linkFor } from "@/lib/useProductLinks";
import type { Product, Step } from "@/lib/types";

/** A simple tinted drawing of the product type, for products without a photo. It always sits on a white tile (like the photos),
 * so packaging uses the light-mode ink colors in both themes; the product itself uses the step's colors. */
export function ProductArt({ step, size = 48, className = "" }: { step: Step; size?: number; className?: string }) {
  const [a, b = a, c = b, d = a] = step.colors;
  const pack = "fill-[#5d5662]";
  const soft = "fill-[#ede4ea] stroke-[#5d5662]/30";
  let art;
  switch (step.category) {
    case "foundation":
      art = (
        <>
          <rect x="29" y="8" width="6" height="10" rx="1.5" className={pack} />
          <rect x="35" y="9" width="9" height="3.5" rx="1.5" className={pack} />
          <rect x="26" y="17" width="12" height="8" rx="2" className={pack} />
          <rect x="18" y="24" width="28" height="34" rx="8" fill={a} className="stroke-[#5d5662]/30" />
        </>
      );
      break;
    case "concealer":
      art = (
        <>
          <rect x="26" y="5" width="12" height="20" rx="5" className={pack} />
          <rect x="25" y="24" width="14" height="34" rx="6" fill={a} className="stroke-[#5d5662]/30" />
        </>
      );
      break;
    case "blush":
    case "bronzer":
    case "contour":
    case "highlighter":
      art = (
        <>
          <circle cx="32" cy="32" r="24" className={soft} strokeWidth="1" />
          <circle cx="32" cy="32" r="17" fill={a} />
          {step.category === "highlighter" && <circle cx="26" cy="26" r="5" className="fill-white" opacity="0.6" />}
        </>
      );
      break;
    case "eye_shadow":
      art = (
        <>
          <rect x="8" y="16" width="48" height="32" rx="6" className={soft} strokeWidth="1" />
          {[a, b, c, d].map((color, i) => (
            <rect key={i} x={13 + (i % 2) * 20} y={21 + Math.floor(i / 2) * 12} width="18" height="10" rx="3" fill={color} />
          ))}
        </>
      );
      break;
    case "eye_liner":
    case "eyebrows":
      art = (
        <g transform="rotate(-40 32 32)">
          <rect x="12" y="28" width="34" height="8" rx="2" className={pack} />
          <path d="M46 28 L56 32 L46 36 Z" className="fill-[#ede4ea]" />
          <path d="M53 30.8 L56 32 L53 33.2 Z" fill={a} />
          <rect x="12" y="28" width="5" height="8" rx="1.5" fill={a} />
        </g>
      );
      break;
    case "eyelashes":
      art = (
        <>
          <rect x="18" y="20" width="12" height="38" rx="5" className={pack} />
          <rect x="18" y="34" width="12" height="4" fill={a} />
          <rect x="38" y="6" width="2" height="34" rx="1" className="fill-[#5d5662]" />
          <rect x="35" y="28" width="8" height="14" rx="4" fill={a} />
        </>
      );
      break;
    case "lip_color":
      art =
        step.finish === "gloss" || step.finish === "sheer" ? (
          <>
            <rect x="26" y="4" width="12" height="18" rx="5" className={pack} />
            <rect x="25" y="21" width="14" height="37" rx="6" fill={a} opacity="0.85" className="stroke-[#5d5662]/30" />
            <rect x="28" y="25" width="3" height="28" rx="1.5" className="fill-white" opacity="0.5" />
          </>
        ) : (
          <>
            <path d="M25 30 L25 14 Q25 8 32 6 L39 10 L39 30 Z" fill={a} />
            <rect x="23" y="28" width="18" height="10" rx="2" className="fill-[#ede4ea] stroke-[#5d5662]/30" />
            <rect x="21" y="37" width="22" height="21" rx="3" className={pack} />
          </>
        );
      break;
  }
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      {art}
    </svg>
  );
}

/** The product photo when there is one, otherwise (or if it fails to load) the tinted drawing.
 * Prefers the photo of the exact store page found by web search, then Open Beauty Facts. */
export function ProductPreview({ step, size, onPhoto }: { step: Step; size: number; onPhoto?: (source: string | null) => void }) {
  const { session } = useSession();
  const link = linkFor(session, step);
  const [failed, setFailed] = useState<string[]>([]);
  const candidates = [
    link?.image ? { src: link.image, source: link.store } : null,
    (step.product as Product | undefined)?.image ? { src: (step.product as Product).image!, source: "Open Beauty Facts" } : null,
  ].filter((c): c is { src: string; source: string } => !!c && !failed.includes(c.src));
  const photo = candidates[0];
  const image = photo?.src;
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external product photo
      <img
        key={image}
        src={image}
        alt={`${step.product.brand} ${step.product.name}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => onPhoto?.(photo.source)}
        onError={() => (setFailed((f) => [...f, image]), onPhoto?.(null))}
        className="size-full object-contain p-2 mix-blend-multiply"
      />
    );
  }
  return <ProductArt step={step} size={size} />;
}
