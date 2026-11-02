"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
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

// `tapped` reaches the leaving icon through AnimatePresence's custom, so its exit knows whether to animate.
const SKY: Variants = {
  rise: (tapped: boolean) => (tapped ? { x: -12, y: 24, rotate: -30, opacity: 0 } : { opacity: 1 }),
  // Slow and soft: the next one rises once the current one is mostly down, easing to a gentle stop.
  up: { x: 0, y: 0, rotate: 0, opacity: 1, transition: { duration: 1.1, delay: 0.45, ease: [0.22, 1, 0.36, 1] } },
  set: (tapped: boolean) =>
    tapped
      ? { x: 24, y: -22, rotate: 40, opacity: 0, transition: { duration: 0.9, ease: [0.55, 0, 0.75, 0.4] } }
      : { opacity: 0, transition: { duration: 0 } },
};

/** Sun/moon button that flips light and dark mode and remembers it. */
export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, dark, () => false);
  // Only her taps animate; the swap right after hydration (server can't know her theme) is instant.
  const [tapped, setTapped] = useState(false);
  function flip() {
    setTapped(true);
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
      className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface text-ink"
    >
      {/* The current icon drifts up and away to the right while the next one rises from below on the left. */}
      <AnimatePresence initial={false} custom={tapped}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          className="absolute grid place-items-center"
          custom={tapped}
          variants={SKY}
          initial="rise"
          animate="up"
          exit="set"
        >
          <Icon icon={isDark ? Sun03Icon : Moon02Icon} size={24} />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
