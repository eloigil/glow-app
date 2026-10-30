// Where her features are on the photo, so "how to apply" strokes land on her cheekbones, lash line and lips.
// MediaPipe Face Landmarker runs in the browser, once per photo; every render keeps the photo's framing,
// so the same points fit every step. Runtime and model load from CDNs on first use (about 4 MB).

/** 478 points, x and y in 0-1 of the image (MediaPipe's face mesh order). */
export type Landmarks = { x: number; y: number }[];

// Keep in step with the installed @mediapipe/tasks-vision version.
const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

let landmarker: Promise<import("@mediapipe/tasks-vision").FaceLandmarker> | undefined;
const cache = new Map<string, Promise<Landmarks | null>>();

function load() {
  // MediaPipe prints startup "INFO:" lines through console.error, which Next's dev overlay reports as errors.
  // Filtered for good rather than around each call: overlapping calls would restore the wrong console.error.
  if (!landmarker) {
    const error = console.error;
    console.error = (...args: unknown[]) => void (String(args[0]).startsWith("INFO:") || error(...args));
  }
  landmarker ??= import("@mediapipe/tasks-vision").then(async ({ FaceLandmarker, FilesetResolver }) =>
    FaceLandmarker.createFromOptions(await FilesetResolver.forVisionTasks(WASM), {
      baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
      runningMode: "IMAGE",
      numFaces: 1,
    }),
  );
  landmarker.catch(() => (landmarker = undefined)); // a failed download can be retried next time
  return landmarker;
}

async function detect(src: string): Promise<Landmarks | null> {
  const img = new Image();
  // onload rather than decode(): decode() can wait for a paint that a background tab never does.
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });
  const face = (await load()).detect(img).faceLandmarks[0];
  return face ? face.map(({ x, y }) => ({ x, y })) : null;
}

/** Her face's landmarks, or null when no face is found or MediaPipe can't load (e.g. offline). */
export function faceLandmarks(src: string): Promise<Landmarks | null> {
  if (!cache.has(src)) {
    // Only "no face" is remembered; a failed download is tried again next time.
    cache.set(src, detect(src).catch(() => (cache.delete(src), null)));
  }
  return cache.get(src)!;
}
