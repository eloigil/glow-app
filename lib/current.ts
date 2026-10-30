import { get, set } from "idb-keyval";
import type { Session } from "@/lib/session";

// Today's photo and everything already paid for (analysis, looks, renders, product pages), kept on the device
// so coming back to the photo screen can reuse them instead of spending YouCam units and OpenAI tokens again.
type Current = {
  /** Schema version; a record with another version is ignored. */
  v: 1;
  photo: Blob;
  session: Pick<Session, "analysis" | "tone" | "looks" | "looksFor" | "stepImages" | "stepPlaceholders" | "productLinks">;
};

const KEY = "glow.current";
const VERSION = 1;

/** Stores the session's photo and results. A saved look being replayed is not today's photo, so it is skipped. */
export async function saveCurrent(s: Session) {
  if (s.savedId || !s.photo || !s.analysis) return;
  const photo = await (await fetch(s.photo)).blob(); // data: and blob: URLs fetch locally
  const { analysis, tone, looks, looksFor, stepImages, stepPlaceholders, productLinks } = s;
  const record: Current = { v: VERSION, photo, session: { analysis, tone, looks, looksFor, stepImages, stepPlaceholders, productLinks } };
  await set(KEY, record);
}

/** The last photo and its results as a session, or undefined when there is none. */
export async function loadCurrent(): Promise<Session | undefined> {
  const c = await get<Current>(KEY);
  if (c?.v !== VERSION) return undefined;
  // ponytail: this object URL lives until the tab closes, like the saved looks' ones.
  return { ...c.session, photo: URL.createObjectURL(c.photo) };
}
