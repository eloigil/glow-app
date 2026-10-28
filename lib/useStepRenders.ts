"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import { postJson } from "@/lib/postJson";
import { useSession, type Session } from "@/lib/session";
import type { Look, RenderResponse } from "@/lib/types";

// Survives leaving /tutorial: a step is sent once per photo, look and index, even across remounts.
// Holds the look it was sent for, so a result arriving after the looks were redesigned is dropped.
const started = new Map<string, Look>();

export type Preview = { image?: string; standIn: boolean; error?: string; retry: () => void };

const stepKey = (fileId: string, lookId: string, i: number) => `${fileId}:${lookId}:${i}`;

/** Forget every render of this photo; call when new looks replace the old ones (ids repeat: look-1..look-5). */
export function resetRenders(fileId: string) {
  for (const k of started.keys()) if (k.startsWith(`${fileId}:`)) started.delete(k);
}

/** Paints steps 0..i of a look into the session. A look's preview is its last step, so the grid and tutorial share it. */
async function renderStep(look: Look, i: number, fileId: string, setSession: Dispatch<SetStateAction<Session>>) {
  const key = stepKey(fileId, look.id, i);
  if (started.has(key)) return;
  started.set(key, look);
  setSession((s) => {
    const stepErrors = { ...s.stepErrors };
    delete stepErrors[key];
    return { ...s, stepErrors };
  });
  try {
    const body = await postJson<RenderResponse>("/api/render", { fileId, steps: look.steps.slice(0, i + 1) });
    if (started.get(key) !== look) return;
    setSession((s) => {
      const list = [...(s.stepImages?.[look.id] ?? [])];
      const stand = [...(s.stepPlaceholders?.[look.id] ?? [])];
      list[i] = body.image;
      stand[i] = !!body.placeholder;
      return {
        ...s,
        stepImages: { ...s.stepImages, [look.id]: list },
        stepPlaceholders: { ...s.stepPlaceholders, [look.id]: stand },
      };
    });
  } catch (e) {
    if (started.get(key) !== look) return;
    started.delete(key);
    setSession((s) => ({ ...s, stepErrors: { ...s.stepErrors, [key]: (e as Error).message } }));
  }
}

/**
 * Renders every tutorial step of a look (step i = steps 0..i applied), step 1 first, then two at a time.
 * Images, replay stand-ins and errors live in the session so revisiting a look never repaints (or re-spends units).
 */
export function useStepRenders(look: Look | undefined, photoId: string | undefined) {
  const { session, setSession } = useSession();
  const fileId = session.savedId ? undefined : photoId; // a saved look replays offline: never fetch
  const images = (look && session.stepImages?.[look.id]) || [];
  const placeholders = (look && session.stepPlaceholders?.[look.id]) || [];
  const errors = look && fileId ? look.steps.map((_, i) => session.stepErrors?.[stepKey(fileId, look.id, i)]) : [];

  const render = useCallback(
    (i: number) => (look && fileId ? renderStep(look, i, fileId, setSession) : Promise.resolve()),
    [look, fileId, setSession],
  );

  useEffect(() => {
    if (!look) return;
    const todo = look.steps.map((_, i) => i).filter((i) => !images[i]);
    (async () => {
      if (todo[0] === 0) await render(todo.shift()!);
      const worker = async () => {
        for (let i = todo.shift(); i !== undefined; i = todo.shift()) await render(i);
      };
      await Promise.all([worker(), worker()]);
    })();
    // Run once per look; `images` is only read to skip steps already painted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [look, render]);

  return { images, placeholders, errors, retry: (i: number) => void render(i) };
}

/** Previews for the looks grid: each look's full step list, all in parallel, stored as its last tutorial step. */
export function useLookPreviews(looks: Look[] | undefined, photoId: string | undefined): Preview[] {
  const { session, setSession } = useSession();
  const fileId = session.savedId ? undefined : photoId;
  const last = (l: Look) => l.steps.length - 1;

  useEffect(() => {
    if (!looks || !fileId) return;
    for (const l of looks) if (!session.stepImages?.[l.id]?.[last(l)]) renderStep(l, last(l), fileId, setSession);
    // Run once per set of looks; cached previews are skipped above and inside renderStep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looks, fileId, setSession]);

  return (looks ?? []).map((l) => ({
    image: session.stepImages?.[l.id]?.[last(l)],
    standIn: !!session.stepPlaceholders?.[l.id]?.[last(l)],
    error: fileId ? session.stepErrors?.[stepKey(fileId, l.id, last(l))] : undefined,
    retry: () => {
      if (fileId) void renderStep(l, last(l), fileId, setSession);
    },
  }));
}
