import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ink" | "quiet";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap px-6 py-3.5 text-[15px] font-medium transition-transform duration-200 ease-[cubic-bezier(.16,1,.3,1)] active:translate-y-px active:scale-[.98] disabled:opacity-50 disabled:active:scale-100";

const variants: Record<Variant, string> = {
  // Gradient primary, 8px corners (prd.md > Look and Feel).
  primary: "btn-gradient rounded-[8px]",
  // The one exception: Welcome Start is an ink pill.
  ink: "rounded-full bg-[#17141a] text-[#fdfcfd] shadow-[0_8px_20px_rgb(23_20_26/.18)]",
  quiet: "glass rounded-[8px] text-ink",
};

/** Class string for links styled as buttons. */
export function buttonClass(variant: Variant = "primary", extra = "") {
  return `${base} ${variants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />;
}
