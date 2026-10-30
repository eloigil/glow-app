"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft01Icon, Camera01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { ScanSweep } from "@/components/ScanSweep";
import { Sheet } from "@/components/Sheet";
import { loadCurrent } from "@/lib/current";
import { resizePhoto } from "@/lib/image";
import { postJson } from "@/lib/postJson";
import { useSession, type Session } from "@/lib/session";
import { readTone, writeTone } from "@/lib/toneCache";
import type { AnalyzeResponse } from "@/lib/types";

type State = { kind: "idle" } | { kind: "analyzing"; preview: string } | { kind: "error"; preview: string; message: string };

export default function AddPhoto() {
  const router = useRouter();
  const { session, setSession } = useSession();
  const [state, setState] = useState<State>({ kind: "idle" });
  // Today's photo, already analyzed: reusing it costs nothing. Null when the device has none, undefined while reading.
  const live = session.photo && session.analysis && !session.savedId ? session : undefined;
  const [stored, setStored] = useState<Session | null>();
  const current = live ?? stored;
  const [picking, setPicking] = useState(false);
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  useEffect(() => {
    if (live) return;
    let cancelled = false;
    loadCurrent()
      .catch(() => undefined)
      .then((c) => {
        if (!cancelled) return setStored(c ?? null);
        if (c?.photo) URL.revokeObjectURL(c.photo);
      });
    return () => {
      cancelled = true;
    };
  }, [live]);

  function reuse() {
    if (!current) return;
    if (current !== live) setSession(current);
    router.push("/analysis");
  }

  // Open the picker inside the tap itself (browsers require it), then let the menu slide away.
  function pick(input: HTMLInputElement | null, dismiss: () => void) {
    input?.click();
    dismiss();
  }

  async function analyze(file: File) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const preview = (previewUrl.current = URL.createObjectURL(file));
    setState({ kind: "analyzing", preview });
    try {
      const cached = readTone();
      const form = new FormData();
      try {
        form.append("photo", await resizePhoto(file), "photo.jpg");
      } catch {
        setState({ kind: "error", preview, message: "This photo didn't work. Try another." });
        return;
      }
      form.append("hasTone", cached ? "1" : "0");
      const body = await postJson<AnalyzeResponse>("/api/analyze", form);
      if (body.tone) writeTone(body.tone);
      setSession({ photo: body.photo ?? preview, analysis: body, tone: body.tone ?? cached });
      previewUrl.current = null; // the analysis page still shows this URL
      router.push("/analysis");
    } catch (e) {
      setState({ kind: "error", preview, message: (e as Error).message });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) analyze(file);
  }

  return (
    <div className="flex flex-1 flex-col px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">
      <Link href="/" aria-label="Back" className="grid size-10 place-items-center rounded-full bg-surface text-ink">
        <Icon icon={ArrowLeft01Icon} size={24} />
      </Link>

      {state.kind === "idle" ? (
        <>
          <h1 className="mt-6 font-display text-[26px] leading-tight font-bold tracking-[-0.02em]">Show us your face today</h1>
          <p className="mt-2 text-ink-muted">Hold the camera close so your face fills the frame, in soft even light. No makeup works best.</p>
          {current?.photo ? (
            <div className="relative mt-8 aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-wash">
              {/* eslint-disable-next-line @next/next/no-img-element -- local object/data URL */}
              <img src={current.photo} alt="Your current photo" className="absolute inset-0 size-full object-cover" />
              <span className="glass absolute top-3 left-3 rounded-full px-3 py-1 text-xs font-medium">
                {current.looks?.length ? `Current photo · ${current.looks.length} looks ready` : "Current photo"}
              </span>
            </div>
          ) : (
            <div className="face-placeholder mt-8 aspect-[3/4] w-full rounded-[10px]" aria-hidden />
          )}
          <div className="mt-auto grid gap-3 pt-8">
            {current ? (
              <>
                <Button onClick={reuse}>Use this photo</Button>
                <Button variant="quiet" onClick={() => setPicking(true)} className="border-line bg-surface">
                  <Icon icon={Camera01Icon} size={28} /> Take another photo
                </Button>
              </>
            ) : (
              <Button onClick={() => setPicking(true)}>
                <Icon icon={Camera01Icon} size={28} /> Take a photo
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-[10px] bg-wash">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
            <img src={state.preview} alt="Your photo" className="absolute inset-0 size-full object-cover" />
            {state.kind === "analyzing" && <ScanSweep />}
          </div>
          {state.kind === "analyzing" ? (
            <p className="mt-6 text-center text-ink-muted" role="status">
              Reading your skin…
            </p>
          ) : (
            <div className="mt-6 rounded-[10px] border border-line bg-surface p-5" role="alert">
              <p className="font-medium">{state.message}</p>
              <Button className="mt-4 w-full" onClick={() => setState({ kind: "idle" })}>
                Retry
              </Button>
            </div>
          )}
        </>
      )}

      {picking && (
        <Sheet labelledBy="pick-title" onClose={() => setPicking(false)}>
          {(dismiss) => (
            <>
              <h2 id="pick-title" className="font-semibold">
                Add a photo
              </h2>
              <div className="mt-4 grid gap-2">
                <Button onClick={() => pick(cameraInput.current, dismiss)}>
                  <Icon icon={Camera01Icon} size={28} /> Use camera
                </Button>
                <Button variant="quiet" onClick={() => pick(uploadInput.current, dismiss)} className="border-line bg-surface">
                  <Icon icon={ImageUploadIcon} size={28} /> Upload photo
                </Button>
                <Button variant="quiet" onClick={dismiss}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Sheet>
      )}

      <input ref={cameraInput} type="file" accept="image/*" capture="user" hidden onChange={onPick} />
      <input ref={uploadInput} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}
