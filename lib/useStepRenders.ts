"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/lib/session";
import type { ApiErrorBody, Look, RenderResponse } from "@/lib/types";

/**
 * Renders every tutorial step of a look (step i = steps 0..i applied), step 1 first, then two at a time.
 * Images live in the session so revisiting a look never repaints (or re-spends units).
 */
export function useStepRenders(look: Look | undefined, fileId: string | undefined) {
  const { session, setSession } = useSession();
  const images = (look && session.stepImages?.[look.id]) || [];
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [placeholder, setPlaceholder] = useState(false);
  const started = useRef(new Set<number>());

  const render = useCallback(
    async (i: number) => {
      if (!look || !fileId || started.current.has(i)) return;
      started.current.add(i);
      setErrors((errs) => {
        const next = { ...errs };
        delete next[i];
        return next;
      });
      try {
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId, steps: look.steps.slice(0, i + 1) }),
        });
        const body = (await res.json()) as RenderResponse | ApiErrorBody;
        if (!res.ok || "error" in body) throw new Error("error" in body ? body.error.message : undefined);
        if (body.placeholder) setPlaceholder(true);
        setSession((s) => {
          const list = [...(s.stepImages?.[look.id] ?? [])];
          list[i] = body.image;
          return { ...s, stepImages: { ...s.stepImages, [look.id]: list } };
        });
      } catch (e) {
        started.current.delete(i);
        setErrors((errs) => ({ ...errs, [i]: (e as Error).message || "This step didn't paint. Try again." }));
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

  return { images, errors, placeholder, retry: render };
}
