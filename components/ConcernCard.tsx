import { Icon } from "@/components/Icon";
import type { IconSvgElement } from "@hugeicons/react";

export function ConcernCard({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: IconSvgElement;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`glass flex w-full items-center gap-3 rounded-[10px] px-3.5 py-3 text-left transition-colors ${active ? "ring-2 ring-rose" : ""}`}
    >
      <span className="text-rose">
        <Icon icon={icon} />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-medium">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
    </button>
  );
}
