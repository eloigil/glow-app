"use client";

import { useEffect, useState } from "react";
import { ImageAdd02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { MakeupLoader } from "@/components/MakeupLoader";
import { PhotoSource } from "@/components/PhotoSource";
import { resizePhoto } from "@/lib/image";
import { postJson } from "@/lib/postJson";
import { useSession } from "@/lib/session";
import type { CopyResponse, LooksRequest } from "@/lib/types";

// One copy at a time per photo, even if she leaves Looks mid-copy and comes back (it costs YouCam units).
let pending: { fileId: string; preview: string; done: Promise<unknown> } | undefined;

type State = { kind: "idle" } | { kind: "copying"; preview: string } | { kind: "error"; message: string };

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/**
 * The last card on Looks: she uploads a makeup look she loves and the copied look joins the grid like any other,
 * with its own tutorial.
 */
export function CopyCard({ onCopied }: { onCopied: (lookId: string) => void }) {
  const { session, setSession } = useSession();
  const [picking, setPicking] = useState(false);
  const [state, setState] = useState<State>(() =>
    pending && pending.fileId === session.analysis?.fileId ? { kind: "copying", preview: pending.preview } : { kind: "idle" },
  );
  useEffect(() => {
    if (state.kind !== "copying" || !pending) return;
    let live = true;
    // Back on Looks while an earlier copy runs: wait for it, the copied look arrives through the session.
    pending.done.finally(() => live && setState({ kind: "idle" }));
    return () => {
      live = false;
    };
  }, [state.kind]);

  async function copy(file: File) {
    const { photo, analysis, tone } = session;
    if (!photo || !analysis || pending) return;
    let inspiration: Blob, her: Blob, preview: string;
    try {
      // Makeup Transfer takes images up to 1024px on the long side.
      [inspiration, her] = await Promise.all([resizePhoto(file, 1024), fetch(photo).then((r) => r.blob()).then((b) => resizePhoto(b, 1024))]);
      preview = await toDataUrl(inspiration);
    } catch {
      setState({ kind: "error", message: "This photo didn't work. Try another." });
      return;
    }
    setState({ kind: "copying", preview });
    let finish = () => {};
    pending = { fileId: analysis.fileId, preview, done: new Promise((r) => (finish = () => r(undefined))) };
    try {
      const form = new FormData();
      form.append("photo", her, "photo.jpg");
      form.append("inspiration", inspiration, "inspiration.jpg");
      form.append("req", JSON.stringify({ concerns: analysis.concerns, skinType: analysis.skinType, tone } satisfies LooksRequest));
      const body = await postJson<CopyResponse>("/api/copy", form);
      setSession((s) =>
        s.analysis?.fileId === analysis.fileId
          ? { ...s, looks: [...(s.looks ?? []), body.look], copies: { ...s.copies, [body.look.id]: { inspiration: preview } } }
          : s,
      );
      setState({ kind: "idle" });
      onCopied(body.look.id);
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message || "This photo didn't work. Try another." });
    } finally {
      pending = undefined;
      finish();
    }
  }

  return (
    <>
      {state.kind === "copying" ? (
        <div className="relative aspect-[3/4] overflow-hidden rounded-[10px] bg-wash" role="status">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
          <img src={state.preview} alt="Your inspiration photo" className="absolute inset-0 size-full object-cover opacity-70" />
          <div className="absolute inset-x-2 bottom-2">
            <MakeupLoader label="Copying this look" />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setPicking(true)}
          className="glass flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-[10px] border-dashed p-4 text-center"
        >
          <span className="grid size-12 place-items-center rounded-full bg-wash text-rose">
            <Icon icon={ImageAdd02Icon} size={28} />
          </span>
          <span className="font-semibold">Copy a look</span>
          <span className="text-xs leading-snug text-ink-muted">
            {state.kind === "error" ? state.message : "Upload a makeup you love and learn it on your face"}
          </span>
        </button>
      )}
      <PhotoSource
        open={picking}
        title="Add the look you love"
        camera="environment"
        onClose={() => setPicking(false)}
        onFile={(file) => void copy(file)}
      />
    </>
  );
}
