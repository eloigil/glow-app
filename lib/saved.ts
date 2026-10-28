import { get, getMany, keys, set } from "idb-keyval";
import type { Concern, Look } from "@/lib/types";

// spec.md > Data Model (SavedLook): the real images live on the device, so a saved look replays offline.
export type SavedLook = {
  /** Schema version; records with another version are ignored. */
  v: 1;
  id: string;
  look: Look;
  /** Today's concerns, for the "For your ... today" chips. */
  concerns: Concern[];
  savedAt: string;
  original: Blob;
  /** Index i = her face with steps 0..i applied. */
  steps: Blob[];
};

const PREFIX = "glow.saved.";
const VERSION = 1;

/** data: and blob: URLs both fetch locally, no network. */
const toBlob = async (url: string) => (await fetch(url)).blob();

export async function saveLook(id: string, look: Look, concerns: Concern[], photo: string, images: string[]) {
  const [original, ...steps] = await Promise.all([photo, ...images].map(toBlob));
  const saved: SavedLook = { v: VERSION, id, look, concerns, savedAt: new Date().toISOString(), original, steps };
  await set(PREFIX + id, saved);
}

export async function isSaved(id: string) {
  return (await get<SavedLook>(PREFIX + id))?.v === VERSION;
}

export async function listSaved(): Promise<SavedLook[]> {
  const ids = (await keys()).filter((k): k is string => typeof k === "string" && k.startsWith(PREFIX));
  const all = (await getMany<SavedLook | undefined>(ids)).filter((s): s is SavedLook => s?.v === VERSION);
  return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}
