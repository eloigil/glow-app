"use client";

import { useState } from "react";
import { ImageAdd02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/Icon";
import { MakeupLoader } from "@/components/MakeupLoader";
import { PhotoSource } from "@/components/PhotoSource";
import { resizePhoto } from "@/lib/image";
import { postJson } from "@/lib/postJson";
import { useSession } from "@/lib/session";
import type { CopyResponse, LooksRequest } from "@/lib/types";

type State = { kind: "idle" } | { kind: "copying"; preview: string } | { kind: "error"; message: string };

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });

/**
 * The last card on Looks: she uploads a makeup look she loves; YouCam paints it on her face (the goal) and the
 * copied look joins the grid like any other, with its own tutorial.
 */
export function CopyCard({ onCopied }: { onCopied: (lookId: string) => void }) {
  const { session, setSession } = useSession();
  const [picking, setPicking] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  async function copy(file: File) {
    const { photo, analysis, tone } = session;
    if (!photo || !analysis) return;
    try {
      // Makeup Transfer takes images up to 1024px on the long side.
      const [inspiration, her] = await Promise.all([resizePhoto(file, 1024), fetch(photo).then((r) => r.blob()).then((b) => resizePhoto(b, 1024))]);
      const preview = await toDataUrl(inspiration);
      setState({ kind: "copying", preview });
      const form = new FormData();
      form.append("photo", her, "photo.jpg");
      form.append("inspiration", inspiration, "inspiration.jpg");
      form.append("req", JSON.stringify({ concerns: analysis.concerns, skinType: analysis.skinType, tone } satisfies LooksRequest));
      const body = await postJson<CopyResponse>("/api/copy", form);
      setSession((s) =>
        s.analysis?.fileId === analysis.fileId
          ? { ...s, looks: [...(s.looks ?? []), body.look], copies: { ...s.copies, [body.look.id]: { goal: body.goal, inspiration: preview } } }
          : s,
      );
      setState({ kind: "idle" });
      onCopied(body.look.id);
    } catch (e) {
      setState({ kind: "error", message: (e as Error).message || "This photo didn't work. Try another." });
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
