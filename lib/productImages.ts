import "server-only";
import type { Product } from "@/lib/types";

// Product photos from Open Beauty Facts (open database, images CC BY-SA): https://world.openbeautyfacts.org
// Coverage is partial, so a miss returns undefined and the UI draws a tinted product shape instead.
const SEARCH = "https://world.openbeautyfacts.org/cgi/search.pl";
const cache = new Map<string, Promise<string | undefined>>();

const words = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);

async function lookup(p: Product): Promise<string | undefined> {
  const url = `${SEARCH}?search_simple=1&json=1&page_size=10&search_terms=${encodeURIComponent(`${p.brand} ${p.name}`)}`;
  const res = await fetch(url, { headers: { "User-Agent": "GlowApp hackathon prototype" }, signal: AbortSignal.timeout(5000) });
  if (!res.ok) return undefined;
  const { products = [] } = (await res.json()) as { products?: { product_name?: string; brands?: string; image_front_small_url?: string; image_front_url?: string }[] };
  const brand = words(p.brand)[0];
  const line = words(p.name);
  // Same brand and most of the product line's words, so a "Fit Me" search never shows another product.
  const match = products.find((r) => {
    const text = `${r.brands ?? ""} ${r.product_name ?? ""}`.toLowerCase();
    const hits = line.filter((w) => text.includes(w)).length;
    return (r.image_front_url || r.image_front_small_url) && brand && text.includes(brand) && hits >= Math.ceil(line.length * 0.6);
  });
  return match?.image_front_url ?? match?.image_front_small_url;
}

export function findProductImage(p: Product): Promise<string | undefined> {
  const key = `${p.brand}|${p.name}`.toLowerCase();
  if (!cache.has(key)) cache.set(key, lookup(p).catch(() => undefined));
  return cache.get(key)!;
}
