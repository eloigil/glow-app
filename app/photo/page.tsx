"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft01Icon, Camera01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { ScanSweep } from "@/components/ScanSweep";
import { resizePhoto } from "@/lib/image";
import { useSession } from "@/lib/session";
import { readTone, writeTone } from "@/lib/tone";
import type { AnalyzeResponse, ApiErrorBody } from "@/lib/types";

type State = { kind: "idle" } | { kind: "analyzing"; preview: string } | { kind: "error"; preview: string; message: string };

export default function AddPhoto() {
  const router = useRouter();
  const { setSession } = useSession();
  const [state, setState] = useState<State>({ kind: "idle" });
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);

  async function analyze(file: File) {
    const preview = URL.createObjectURL(file);
    setState({ kind: "analyzing", preview });
    try {
      const cached = readTone();
      const form = new FormData();
      form.append("photo", await resizePhoto(file), "photo.jpg");
      form.append("hasTone", cached ? "1" : "0");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const body = (await res.json()) as AnalyzeResponse | ApiErrorBody;
      if (!res.ok || "error" in body) {
        const message = "error" in body ? body.error.message : "This photo didn't work. Try another.";
        setState({ kind: "error", preview, message });
        return;
      }
      if (body.tone) writeTone(body.tone);
      setSession({ photo: body.photo ?? preview, analysis: body, tone: body.tone ?? cached });
      router.push("/analysis");
    } catch {
      setState({ kind: "error", preview, message: "Something went wrong. Check your connection and try again." });
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
        <Icon icon={ArrowLeft01Icon} size={20} />
      </Link>

      {state.kind === "idle" ? (
        <>
          <h1 className="mt-6 font-display text-[26px] leading-tight font-bold tracking-[-0.02em]">Show us your face today</h1>
          <p className="mt-2 text-ink-muted">Face the camera in soft, even light. No makeup works best.</p>
          <div className="face-placeholder mt-8 aspect-[3/4] w-full rounded-[10px]" aria-hidden />
          <div className="mt-auto grid gap-3 pt-8">
            <Button onClick={() => cameraInput.current?.click()}>
              <Icon icon={Camera01Icon} size={20} /> Take a photo
            </Button>
            <Button variant="quiet" onClick={() => uploadInput.current?.click()} className="border-line bg-surface">
              <Icon icon={ImageUploadIcon} size={20} /> Upload a picture
            </Button>
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

      <input ref={cameraInput} type="file" accept="image/*" capture="user" hidden onChange={onPick} />
      <input ref={uploadInput} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}
