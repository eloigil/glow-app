"use client";

import { useCallback, useEffect } from "react";
import { postJson } from "@/lib/postJson";
import { useSession } from "@/lib/session";
import type { Look, RenderResponse } from "@/lib/types";

// Survives leaving /tutorial: a step is sent once per photo, look and index, even across remounts.
const started = new Set<string>();

/**
 * Renders every tutorial step of a look (step i = steps 0..i applied), step 1 first, then two at a time.
 * Images, replay stand-ins and errors live in the session so revisiting a look never repaints (or re-spends units).
 */
export function useStepRenders(look: Look | undefined, fileId: string | undefined) {
  const { session, setSession } = useSession();
  const images = (look && session.stepImages?.[look.id]) || [];
  const placeholders = (look && session.stepPlaceholders?.[look.id]) || [];
  const errors = look ? look.steps.map((_, i) => session.stepErrors?.[`${look.id}:${i}`]) : [];

  const render = useCallback(
    async (i: number) => {
      if (!look || !fileId) return;
      const key = `${look.id}:${i}`;
      const startedKey = `${fileId}:${key}`;
      if (started.has(startedKey)) return;
      started.add(startedKey);
      setSession((s) => {
        const stepErrors = { ...s.stepErrors };
        delete stepErrors[key];
        return { ...s, stepErrors };
      });
      try {
        const body = await postJson<RenderResponse>("/api/render", { fileId, steps: look.steps.slice(0, i + 1) });
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
        started.delete(startedKey);
        setSession((s) => ({ ...s, stepErrors: { ...s.stepErrors, [key]: (e as Error).message } }));
      }
    },
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

  return { images, placeholders, errors, retry: render };
}
