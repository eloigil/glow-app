"use client";

import { useSyncExternalStore } from "react";
import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";

// The choice is kept on the device; app/layout.tsx applies it before the first paint.
const THEME_KEY = "glow.theme"; // also read by the inline script in app/layout.tsx

const dark = () =>
  document.documentElement.dataset.theme
    ? document.documentElement.dataset.theme === "dark"
    : matchMedia("(prefers-color-scheme: dark)").matches;

// Re-render on our own toggles (data-theme changes) and on system theme changes.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributeFilter: ["data-theme"] });
  const media = matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener("change", onChange);
  };
}

/** Sun/moon button that flips light and dark mode and remembers it. */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, dark, () => false);
  function flip() {
    const next = isDark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private mode: the switch still works for this visit.
    }
  }
  return (
    <button
      type="button"
      onClick={flip}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-ink"
    >
      <Icon icon={isDark ? Sun03Icon : Moon02Icon} size={24} />
    </button>
  );
}
