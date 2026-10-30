import sharp from "sharp";
import { copyLook } from "@/lib/openai/copy";
import { replayable, ReplayMiss } from "@/lib/replay";
import { toApiError } from "@/lib/youcam/errors";
import { runTask, toDataUrl, uploadImage } from "@/lib/youcam/tasks";
import type { CopyResponse, LooksRequest } from "@/lib/types";

// Copy a look: YouCam Makeup Transfer paints her inspiration photo's makeup on her face (2 units, the goal image),
// then OpenAI vision breaks that makeup into steps she can follow. Replay serves the one recorded copy.
export const maxDuration = 120;

const dataUrl = (bytes: ArrayBuffer, type: string) => `data:${type};base64,${Buffer.from(bytes).toString("base64")}`;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const photo = form.get("photo");
    const inspiration = form.get("inspiration");
    const plan = JSON.parse(String(form.get("req") ?? "null")) as LooksRequest | null;
    if (!(photo instanceof File) || !(inspiration instanceof File) || !Array.isArray(plan?.concerns)) {
      return Response.json({ error: { kind: "photo", code: "missing_photo", message: "Add an inspiration photo first." } }, { status: 400 });
    }

    const result = await replayable<CopyResponse>("copy", async () => {
      const [her, ref] = await Promise.all([photo.arrayBuffer(), inspiration.arrayBuffer()]);
      // Makeup Transfer wants its own uploads with the long side at most 1024px (the browser already resized both).
      const [src, refId] = await Promise.all([uploadImage(her, photo.type || "image/jpeg"), uploadImage(ref, inspiration.type || "image/jpeg")]);
      const res = await runTask<{ url?: string }>("mu-transfer", { src_file_id: src, ref_file_id: refId });
      if (!res.url) throw new Error("Makeup Transfer returned no image");
      const png = Buffer.from((await toDataUrl(res.url)).split(",")[1], "base64");
      const goal = `data:image/jpeg;base64,${(await sharp(png).jpeg({ quality: 86, mozjpeg: true }).toBuffer()).toString("base64")}`;
      const look = await copyLook(plan, dataUrl(ref, inspiration.type || "image/jpeg"), goal);
      return { look, goal };
    });

    // Fresh id per copy: several copies (or the same replayed one twice) can sit in the grid together.
    return Response.json({ ...result, look: { ...result.look, id: `copy-${Date.now().toString(36)}` } } satisfies CopyResponse);
  } catch (err) {
    if (err instanceof ReplayMiss) {
      return Response.json({ error: { kind: "unknown", code: "replay_miss", message: err.message } }, { status: 503 });
    }
    const { status, body } = toApiError(err);
    return Response.json(body, { status });
  }
}
