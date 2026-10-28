import { readFile } from "node:fs/promises";
import path from "node:path";
import { toEffects } from "@/lib/youcam/effects";
import { toApiError } from "@/lib/youcam/errors";
import { runTask, toDataUrl } from "@/lib/youcam/tasks";
import { fixtureKey, replayable, ReplayMiss } from "@/lib/replay";
import type { AnalyzeResponse, RenderRequest, RenderResponse } from "@/lib/types";

// spec.md > Render Route: paint the given steps (cumulative) onto her photo. 1 unit per call.
export const maxDuration = 120;

type VtoResults = { url?: string } | { download_url?: string }[];

export async function POST(req: Request) {
  try {
    const { fileId, steps } = (await req.json()) as RenderRequest;
    if (!fileId || !Array.isArray(steps) || !steps.length) {
      return Response.json({ error: { kind: "unknown", code: "bad_request", message: "Nothing to render." } }, { status: 400 });
    }
    const effects = toEffects(steps);
    const result = await replayable<RenderResponse>(`render/${fixtureKey(effects)}`, async () => {
      const res = await runTask<VtoResults>("makeup-vto", { src_file_id: fileId, effects, version: "1.0" });
      const url = Array.isArray(res) ? res[0]?.download_url : res.url;
      if (!url) throw new Error("Makeup VTO returned no image");
      return { image: await toDataUrl(url) };
    });
    return Response.json(result);
  } catch (err) {
    if (err instanceof ReplayMiss) {
      // Unrecorded steps in replay: hand back the unpainted recorded photo so the UI still flows.
      const fixture = JSON.parse(await readFile(path.join(process.cwd(), "fixtures/analyze.json"), "utf8")) as AnalyzeResponse;
      return Response.json({ image: fixture.photo!, placeholder: true } satisfies RenderResponse);
    }
    const { status, body } = toApiError(err);
    return Response.json(body, { status });
  }
}
