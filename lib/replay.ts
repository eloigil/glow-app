import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// spec.md > Replay Layer. replay (default): answer from fixtures/, 0 units.
// record: real call, saved to fixtures/. live: real call, nothing saved.
export type ApiMode = "replay" | "record" | "live";

const raw = process.env.API_MODE ?? "replay";
export const API_MODE: ApiMode = raw === "record" || raw === "live" ? raw : "replay";

const DIR = path.join(process.cwd(), "fixtures");

export class ReplayMiss extends Error {
  constructor(public fixture: string) {
    super(`No recorded fixture "${fixture}". Run once with API_MODE=record.`);
  }
}

/** Short stable key for a request, e.g. the effect list of a render. */
export function fixtureKey(parts: unknown): string {
  return createHash("sha1").update(JSON.stringify(parts)).digest("hex").slice(0, 12);
}

async function save(name: string, value: unknown) {
  const file = path.join(DIR, `${name}.json`);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(value, null, 2));
}

export async function replayable<T>(name: string, run: () => Promise<T>): Promise<T> {
  if (API_MODE === "replay") {
    try {
      return JSON.parse(await readFile(path.join(DIR, `${name}.json`), "utf8")) as T;
    } catch {
      throw new ReplayMiss(name);
    }
  }
  const result = await run();
  if (API_MODE === "record") await save(name, result);
  return result;
}

/** Record mode only: keep the raw provider response next to the fixture for debugging shapes. */
export async function recordRaw(name: string, value: unknown) {
  if (API_MODE === "record") await save(`raw/${name}`, value);
}

/** The recorded demo photo, used as the unpainted stand-in when a render isn't recorded yet. */
export async function recordedPhoto(): Promise<string | undefined> {
  try {
    return (JSON.parse(await readFile(path.join(DIR, "analyze.json"), "utf8")) as { photo?: string }).photo;
  } catch {
    return undefined;
  }
}
