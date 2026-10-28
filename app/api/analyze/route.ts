import { CONCERNS, DST_ACTIONS, POINT_THRESHOLD } from "@/lib/youcam/concerns";
import { toApiError } from "@/lib/youcam/errors";
import { runTask, toDataUrl, uploadImage } from "@/lib/youcam/tasks";
import { toTone } from "@/lib/youcam/tone";
import { API_MODE, recordRaw, replayable, ReplayMiss } from "@/lib/replay";
import type { AnalyzeResponse, ConcernKey } from "@/lib/types";

// spec.md > Analyze Route: upload once, Skin Analysis (+ Facial Color Tones when no tone is cached), poll, normalize.
export const maxDuration = 120;

type SkinOutput = { type: string; ui_score?: number; mask_urls?: string[]; [k: string]: unknown };
type SkinResults = { output: SkinOutput[] };
type ToneResults = Parameters<typeof toTone>[0];

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const photo = form.get("photo");
    if (!(photo instanceof File)) {
      return Response.json({ error: { kind: "photo", code: "missing_photo", message: "Add a photo first." } }, { status: 400 });
    }
    const hasTone = form.get("hasTone") === "1";

    const result = await replayable<AnalyzeResponse>("analyze", async () => {
      const bytes = await photo.arrayBuffer();
      const type = photo.type || "image/jpeg";
      const fileId = await uploadImage(bytes, type);
      // Record always captures the tone so replay has one; live skips it when the browser already cached it.
      const wantTone = API_MODE === "record" || !hasTone;
      const [skin, tone] = await Promise.all([
        runTask<SkinResults>("skin-analysis", { src_file_id: fileId, dst_actions: DST_ACTIONS, format: "json" }),
        wantTone ? runTask<ToneResults>("skin-tone-analysis", { src_file_id: fileId }) : undefined,
      ]);
      await recordRaw("skin-analysis", skin);
      await recordRaw("skin-tone-analysis", tone);

      const concerns = await Promise.all(
        skin.output
          .filter((o): o is SkinOutput & { type: ConcernKey } => o.type in CONCERNS)
          .map(async (o) => {
            const uiScore = o.ui_score ?? 100;
            const maskUrl = o.mask_urls?.[0];
            return {
              key: o.type,
              label: CONCERNS[o.type],
              uiScore,
              isPoint: false,
              mask: maskUrl ? await toDataUrl(maskUrl) : undefined,
            };
          }),
      );
      const skinTypeOut = skin.output.find((o) => o.type === "skin_type");
      const skinType = skinTypeOut ? String(skinTypeOut.skin_type ?? skinTypeOut.whole ?? "") || undefined : undefined;

      return {
        fileId,
        concerns,
        skinType,
        tone: tone ? toTone(tone) : undefined,
        photo: API_MODE === "record" ? `data:${type};base64,${Buffer.from(bytes).toString("base64")}` : undefined,
      };
    });

    // Points are derived on every request so threshold tuning also applies to recorded fixtures.
    const concerns = result.concerns.map((c) => ({ ...c, isPoint: c.uiScore < POINT_THRESHOLD }));
    return Response.json({ ...result, concerns });
  } catch (err) {
    if (err instanceof ReplayMiss) {
      return Response.json({ error: { kind: "unknown", code: "replay_miss", message: err.message } }, { status: 503 });
    }
    const { status, body } = toApiError(err);
    return Response.json(body, { status });
  }
}
