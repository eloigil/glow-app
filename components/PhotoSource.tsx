"use client";

import { useRef } from "react";
import { Camera01Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Sheet } from "@/components/Sheet";

/**
 * "Use camera / Upload photo" sheet. The file inputs live outside the sheet, so a photo chosen after the sheet
 * has slid away still arrives.
 */
export function PhotoSource({
  open,
  title,
  camera,
  onClose,
  onFile,
}: {
  open: boolean;
  title: string;
  /** Which camera opens: "user" for her face, "environment" for a photo of a magazine or screen. */
  camera: "user" | "environment";
  onClose: () => void;
  onFile: (file: File) => void;
}) {
  const cameraInput = useRef<HTMLInputElement>(null);
  const uploadInput = useRef<HTMLInputElement>(null);

  // Open the picker inside the tap itself (browsers require it), then let the menu slide away.
  function pick(input: HTMLInputElement | null, dismiss: () => void) {
    input?.click();
    dismiss();
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onFile(file);
  }

  return (
    <>
      {open && (
        <Sheet labelledBy="pick-title" onClose={onClose}>
          {(dismiss) => (
            <>
              <h2 id="pick-title" className="font-semibold">
                {title}
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
      <input ref={cameraInput} type="file" accept="image/*" capture={camera} hidden onChange={onPick} />
      <input ref={uploadInput} type="file" accept="image/*" hidden onChange={onPick} />
    </>
  );
}
