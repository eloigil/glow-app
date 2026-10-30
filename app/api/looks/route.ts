import { planLooks } from "@/lib/openai/plan";
import { replayable, ReplayMiss } from "@/lib/replay";
import { toApiError } from "@/lib/youcam/errors";
import type { LooksRequest, LooksResponse } from "@/lib/types";

// spec.md > Looks Route: six looks as strict JSON from OpenAI, validated in lib/openai/plan.ts.
export const maxDuration = 120;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as LooksRequest;
    if (!Array.isArray(body?.concerns)) {
      return Response.json({ error: { kind: "unknown", code: "bad_request", message: "Missing skin read." } }, { status: 400 });
    }
    const looks = await replayable("looks", () => planLooks(body));
    return Response.json({ looks } satisfies LooksResponse);
  } catch (err) {
    if (err instanceof ReplayMiss) {
      return Response.json({ error: { kind: "unknown", code: "replay_miss", message: err.message } }, { status: 503 });
    }
    const { status, body } = toApiError(err);
    return Response.json(body, { status });
  }
}
