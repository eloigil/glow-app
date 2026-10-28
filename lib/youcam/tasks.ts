import "server-only";
import { fetchBytes, fetchOrTimeout, youcam, YouCamError } from "./client";

export type TaskKind = "skin-analysis" | "skin-tone-analysis" | "makeup-vto";

const POLL_MS = 2000;
const TIMEOUT_MS = 60_000;

/** File API: reserve an upload slot, then PUT the bytes to the pre-signed URL. Returns the file_id. */
export async function uploadImage(bytes: ArrayBuffer, contentType = "image/jpeg"): Promise<string> {
  const data = await youcam<{ files: { file_id: string; requests: { url: string; headers?: Record<string, string> }[] }[] }>(
    "/file",
    { method: "POST", body: { files: [{ content_type: contentType, file_name: "photo.jpg", file_size: bytes.byteLength }] } },
  );
  const file = data.files[0];
  const req = file.requests[0];
  const put = await fetchOrTimeout(req.url, {
    method: "PUT",
    headers: { "Content-Type": contentType, ...req.headers },
    body: bytes,
  });
  if (!put.ok) throw new YouCamError("upload_failed", `Upload failed with ${put.status}`);
  return file.file_id;
}

type TaskState<R> = { task_status: string; results?: R; error?: string; failure_reason?: string };

/** Create a task and poll until success or error. Units are only charged on success. */
export async function runTask<R>(kind: TaskKind, body: Record<string, unknown>): Promise<R> {
  const { task_id } = await youcam<{ task_id: string }>(`/task/${kind}`, { method: "POST", body });
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const state = await youcam<TaskState<R>>(`/task/${kind}/${task_id}`);
    if (state.task_status === "success") return state.results as R;
    if (state.task_status === "error") {
      const code = state.error ?? state.failure_reason ?? "task_error";
      throw new YouCamError(code, code);
    }
  }
  throw new YouCamError("TaskTimeout", `${kind} did not finish in ${TIMEOUT_MS / 1000}s`);
}

/** Download a result image (mask, render) and inline it, because YouCam links expire after 2 hours. */
export async function toDataUrl(url: string): Promise<string> {
  // Result images are ~2.5MB; under parallel load the body read alone can pass 15s.
  const buf = await fetchBytes(url, 25_000);
  // YouCam's storage answers with binary/octet-stream, so sniff JPEG from the magic bytes (else PNG).
  const type = buf[0] === 0xff ? "image/jpeg" : "image/png";
  return `data:${type};base64,${buf.toString("base64")}`;
}
