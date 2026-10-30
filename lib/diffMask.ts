// Focus mode: where does this step go on her face?
// - Most steps: both renders share the same photo and framing, so a per-pixel difference between the previous
//   layer and this one is the area to work on. Makeup is applied to both sides, so the mask is mirrored across
//   the face's own center: a weaker render on one side (half an eye) still lights up fully.
// - Foundation: a sheer base changes too little per pixel to trace, but it goes on all of her skin, so the mask
//   is every pixel close to her measured skin tone.

const SAMPLE_WIDTH = 120; // downscaling averages out JPEG noise; the mask is blurred back up so edges stay soft
const NOISE = 7; // summed RGB difference below this is compression noise, not makeup

export type FocusKind = { kind: "diff" } | { kind: "skin"; skinHex: string };

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

/** Per-pixel weights (0-1) of what changed, scaled to this step's own strongest change. */
function changeWeights(pa: Uint8ClampedArray, pb: Uint8ClampedArray, n: number): Float32Array | null {
  const diffs = new Float32Array(n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    diffs[p] = Math.abs(pa[i] - pb[i]) + Math.abs(pa[i + 1] - pb[i + 1]) + Math.abs(pa[i + 2] - pb[i + 2]);
  }
  // Scale to this step's own strongest change, so a soft blush reads as clearly as a bold lip.
  const sorted = [...diffs].sort((x, y) => y - x);
  const strong = sorted[Math.floor(n * 0.01)];
  if (strong <= 0) return null; // identical images: nothing to show
  // A very subtle layer can sit inside the noise band; then highlight its strongest few percent instead,
  // so focus mode always shows where it goes.
  const floor = strong > NOISE * 1.5 ? NOISE : sorted[Math.floor(n * 0.04)];
  const top = Math.max(strong, floor + 1);
  return diffs.map((d) => Math.max(0, Math.min(1, (d - floor) / (top - floor))));
}

/** Weights of pixels whose color is close to her skin: chroma within a tolerance, any reasonable brightness. */
function skinWeights(px: Uint8ClampedArray, n: number, hex: string): Float32Array {
  const v = parseInt(hex.slice(1), 16);
  const [sr, sg, sb] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  const chroma = (r: number, g: number, b: number) => [-0.169 * r - 0.331 * g + 0.5 * b, 0.5 * r - 0.419 * g - 0.081 * b];
  const [scb, scr] = chroma(sr, sg, sb);
  const sy = 0.299 * sr + 0.587 * sg + 0.114 * sb;
  const w = new Float32Array(n);
  for (let i = 0, p = 0; p < n; i += 4, p++) {
    const [cb, cr] = chroma(px[i], px[i + 1], px[i + 2]);
    const y = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const dist = Math.hypot(cb - scb, cr - scr);
    const light = Math.abs(y - sy) < 85 ? 1 : 0;
    w[p] = light * Math.max(0, Math.min(1, (16 - dist) / 6));
  }
  return w;
}

/** Box-blur, then turn the soft result back into a solid region: fills shadowed holes inside the face. */
function fill(wt: Float32Array, w: number, h: number, radius: number): Float32Array {
  let cur = wt;
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(cur.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        let count = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const yy = y + dy, xx = x + dx;
            if (yy >= 0 && yy < h && xx >= 0 && xx < w) {
              sum += cur[yy * w + xx];
              count++;
            }
          }
        }
        out[y * w + x] = sum / count;
      }
    }
    cur = out;
  }
  return cur.map((v) => Math.max(0, Math.min(1, (v - 0.3) / 0.25)));
}

/** Union with its own mirror image across the weighted horizontal center (the face's midline). */
function mirror(wt: Float32Array, w: number, h: number): Float32Array {
  let sum = 0;
  let sx = 0;
  for (let p = 0; p < wt.length; p++) {
    sum += wt[p];
    sx += wt[p] * (p % w);
  }
  if (!sum) return wt;
  const cx = sx / sum;
  const out = new Float32Array(wt.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const mx = Math.round(2 * cx - x);
      const m = mx >= 0 && mx < w ? wt[y * w + mx] : 0;
      out[y * w + x] = Math.max(wt[y * w + x], m);
    }
  }
  return out;
}

/** Grow strokes by a pixel so thin areas (liner, lashes) survive the blur. */
function dilate(wt: Float32Array, w: number, h: number): Float32Array {
  const out = new Float32Array(wt.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const yy = y + dy, xx = x + dx;
          if (yy >= 0 && yy < h && xx >= 0 && xx < w) m = Math.max(m, wt[yy * w + xx]);
        }
      }
      out[y * w + x] = m;
    }
  }
  return out;
}

async function compute(before: string, after: string, focus: FocusKind): Promise<string | null> {
  const [a, b] = await Promise.all([load(before), load(after)]);
  const w = SAMPLE_WIDTH;
  const h = Math.round((w * b.naturalHeight) / b.naturalWidth);
  const n = w * h;
  const pa = pixels(a, w, h);

  let weights: Float32Array | null;
  if (focus.kind === "skin") {
    weights = mirror(fill(skinWeights(pa, n, focus.skinHex), w, h, 4), w, h);
  } else {
    weights = changeWeights(pa, pixels(b, w, h), n);
    if (weights) weights = mirror(weights, w, h);
  }
  if (!weights) return null;
  weights = dilate(weights, w, h);


  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mctx = mask.getContext("2d")!;
  const out = mctx.createImageData(w, h);
  for (let p = 0; p < n; p++) {
    out.data[p * 4] = out.data[p * 4 + 1] = out.data[p * 4 + 2] = 255;
    out.data[p * 4 + 3] = Math.round(weights[p] * 255);
  }
  mctx.putImageData(out, 0, 0);

  // Upscale with a blur so the colored area reads as a soft brush stroke, not pixel noise.
  const soft = document.createElement("canvas");
  soft.width = w * 4;
  soft.height = h * 4;
  const sctx = soft.getContext("2d")!;
  sctx.filter = "blur(10px)";
  sctx.drawImage(mask, 0, 0, soft.width, soft.height);
  sctx.filter = "none";
  sctx.drawImage(soft, 0, 0); // a second pass firms up the inside of the stroke
  return soft.toDataURL("image/png");
}

/** A soft alpha mask (PNG data URL) of where this step goes, or null only if the two renders are identical. */
export function diffMask(before: string, after: string, focus: FocusKind = { kind: "diff" }): Promise<string | null> {
  const key = `${focus.kind}:${before.length}:${before.slice(-64)}|${after.length}:${after.slice(-64)}`;
  if (!cache.has(key)) cache.set(key, compute(before, after, focus).catch(() => null));
  return cache.get(key)!;
}
