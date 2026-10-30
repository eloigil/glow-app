// Focus mode: where did this step change her face? Both renders share the same photo and framing,
// so a per-pixel difference between the previous layer and this one is exactly the area to work on.

const SAMPLE_WIDTH = 120; // downscaling averages out JPEG noise; the mask is blurred back up so edges stay soft
const NOISE = 7; // summed RGB difference below this is compression noise, not makeup
const MIN_COVERAGE = 0.004; // less than this means nothing visibly changed

const cache = new Map<string, Promise<string | null>>();

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function pixels(img: HTMLImageElement, w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  return ctx.getImageData(0, 0, w, h).data;
}

async function compute(before: string, after: string): Promise<string | null> {
  const [a, b] = await Promise.all([load(before), load(after)]);
  const w = SAMPLE_WIDTH;
  const h = Math.round((w * b.naturalHeight) / b.naturalWidth);
  const pa = pixels(a, w, h);
  const pb = pixels(b, w, h);

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d")!;
  const out = mctx.createImageData(w, h);
  const diffs = new Float32Array(w * h);
  for (let i = 0, p = 0; i < pa.length; i += 4, p++) {
    diffs[p] = Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]);
  }
  // Scale to this step's own strongest change, so a soft blush reads as clearly as a bold lip.
  const strong = [...diffs].sort((x, y) => y - x)[Math.floor(diffs.length * 0.01)];
  if (strong <= NOISE) return null;
  let changed = 0;
  for (let p = 0; p < diffs.length; p++) {
    const alpha = Math.max(0, Math.min(255, ((diffs[p] - NOISE) / (strong - NOISE)) * 255));
    if (alpha > 64) changed++;
    out.data[p * 4] = out.data[p * 4 + 1] = out.data[p * 4 + 2] = 255;
    out.data[p * 4 + 3] = alpha;
  }
  if (changed / (w * h) < MIN_COVERAGE) return null;
  mctx.putImageData(out, 0, 0);

  // Upscale with a blur so the colored area reads as a soft brush stroke, not pixel noise.
  const soft = document.createElement("canvas");
  soft.width = w * 4;
  soft.height = h * 4;
  const sctx = soft.getContext("2d")!;
  sctx.filter = "blur(10px)";
  sctx.drawImage(mask, 0, 0, soft.width, soft.height);
  sctx.filter = "none";
  sctx.globalCompositeOperation = "source-over";
  sctx.drawImage(soft, 0, 0); // a second pass firms up the inside of the stroke
  return soft.toDataURL("image/png");
}

/** A soft alpha mask (PNG data URL) of what changed between two renders, or null if nothing visibly did. */
export function diffMask(before: string, after: string): Promise<string | null> {
  const key = `${before.length}:${before.slice(-64)}|${after.length}:${after.slice(-64)}`;
  if (!cache.has(key)) cache.set(key, compute(before, after).catch(() => null));
  return cache.get(key)!;
}
