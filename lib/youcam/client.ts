import "server-only";

// spec.md > YouCam Client. Docs: https://docs.perfectcorp.com/develop/quick_start_guide.md
const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";

/** Error from YouCam itself: a request rejected up front, or a task that ended in `error`. */
export class YouCamError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

function key() {
  const k = process.env.YOUCAM_API_KEY;
  if (!k) throw new YouCamError("missing_api_key", "YOUCAM_API_KEY is not set");
  return k;
}

type Envelope<T> = { status: number; data?: T; error?: string; error_code?: string };

export async function youcam<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || !json.data) {
    throw new YouCamError(json.error_code ?? `http_${res.status}`, json.error ?? res.statusText);
  }
  return json.data;
}
