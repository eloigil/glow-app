import type { ApiErrorBody } from "@/lib/types";

const FALLBACK = "We ran out of credits for the demo. Try later.";
const OFFLINE = "Check your connection and try again.";

/** POSTs JSON (or a FormData as-is) and returns the parsed body; throws an Error with a user-facing message. */
export async function postJson<T>(url: string, body: unknown | FormData): Promise<T> {
  let res: Response;
  try {
    res = await fetch(
      url,
      body instanceof FormData
        ? { method: "POST", body }
        : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
    );
  } catch {
    throw new Error(OFFLINE);
  }
  const data = (await res.json().catch(() => null)) as T | ApiErrorBody | null;
  if (!res.ok || !data || typeof data !== "object" || "error" in data) {
    throw new Error((data as ApiErrorBody | null)?.error?.message || FALLBACK);
  }
  return data;
}
