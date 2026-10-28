import type { Tone } from "@/lib/types";

// Learner's choice: tone is cached on the device so the 20-unit call runs once.
const KEY = "glow.tone";

export function readTone(): Tone | undefined {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Tone) : undefined;
  } catch {
    return undefined;
  }
}

export function writeTone(tone: Tone) {
  try {
    localStorage.setItem(KEY, JSON.stringify(tone));
  } catch {
    // Private mode or storage full: the next session just asks again.
  }
}
