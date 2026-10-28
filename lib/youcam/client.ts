import "server-only";

// spec.md > YouCam Client. Docs: https://docs.perfectcorp.com/develop/quick_start_guide.md
const BASE = "https://yce-api-01.makeupar.com/s2s/v2.0";

/** Error from YouCam itself: a request rejected up front, or a task that ended in `error`. */
export class YouCamError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
  }
}

function key() {
  const k = process.env.YOUCAM_API_KEY;
  if (!k) throw new YouCamError("missing_api_key", "YOUCAM_API_KEY is not set");
  return k;
}

type Envelope<T> = { status: number; data?: T; error?: string; error_code?: string };

/** Network-level timeouts and aborts surface as a TaskTimeout so they get the calm demo message. */
function mapTimeout(e: unknown, url: string): unknown {
  return e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError")
    ? new YouCamError("TaskTimeout", `Request timed out: ${url.split("?")[0]}`)
    : e;
}

export async function fetchOrTimeout(url: string, init: RequestInit, ms = 15_000): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  } catch (e) {
    throw mapTimeout(e, url);
  }
}

/** GET a file's bytes; the timeout covers the body read too, which is the slow part for big images. */
export async function fetchBytes(url: string, ms: number): Promise<Buffer> {
  const res = await fetchOrTimeout(url, { cache: "no-store" }, ms);
  if (!res.ok) throw new YouCamError("download_failed", `Download failed with ${res.status}`);
  try {
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    throw mapTimeout(e, url);
  }
}

export async function youcam<T>(path: string, init?: { method?: "GET" | "POST"; body?: unknown }): Promise<T> {
  const res = await fetchOrTimeout(`${BASE}${path}`, {
    method: init?.method ?? "GET",
    headers: { Authorization: `Bearer ${key()}`, "Content-Type": "application/json" },
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Envelope<T>;
  if (!res.ok || !json.data) {
    throw new YouCamError(json.error_code ?? `http_${res.status}`, json.error ?? res.statusText, res.status);
  }
  return json.data;
}
