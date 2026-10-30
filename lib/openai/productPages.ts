import "server-only";
import OpenAI from "openai";
import { OPENAI_MODEL } from "./model";
import type { Product, ProductLink } from "@/lib/types";

// Exact product pages via OpenAI web search. Amazon doesn't appear in its results, so stores are
// Sephora, Ulta, Target, Walmart or the brand's own shop. Every URL is fetched before it's trusted.
const STORES: [RegExp, string][] = [
  [/sephora\./, "Sephora"],
  [/ulta\./, "Ulta Beauty"],
  [/target\./, "Target"],
  [/walmart\./, "Walmart"],
  [/boots\./, "Boots"],
  [/cultbeauty\./, "Cult Beauty"],
];

/** Known retailers by name; the brand's own site by brand; any other shop by its domain, e.g. "lovelyskin.com". */
function storeOf(url: URL, brand: string): string {
  const known = STORES.find(([re]) => re.test(url.hostname))?.[1];
  if (known) return known;
  const host = url.hostname.replace(/^www\./, "");
  const brandWord = brand.toLowerCase().split(/[^a-z0-9]+/).find((w) => w.length > 2);
  return brandWord && host.includes(brandWord) ? brand : host;
}

/** The page must load (redirects followed); 403 counts as alive since big retailers block bots but the page exists.
 * When the HTML is readable, its og:image is the product photo. */
async function inspect(url: string): Promise<{ alive: boolean; image?: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15", Accept: "text/html" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { alive: res.status === 403 };
    const html = (await res.text()).slice(0, 400_000);
    const meta = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i)?.[0];
    const content = meta?.match(/content=["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&");
    const image = content ? new URL(content, res.url).href : undefined;
    // Some brand sites share one site-wide logo as og:image; that's not a product photo.
    const usable = image?.startsWith("https://") && !/logo|seo-image|placeholder|default/i.test(image);
    return { alive: true, image: usable ? image : undefined };
  } catch {
    return { alive: false };
  }
}

/** Sephora and Ulta serve the shade's own photo at a fixed address built from the SKU in the link,
 * so the photo matches the exact shade even when the page itself blocks bots. */
export function skuImage(url: URL): string | undefined {
  const sku = url.searchParams.get("skuId") ?? url.searchParams.get("SKUID") ?? url.searchParams.get("sku");
  if (!sku || !/^\d+$/.test(sku)) return undefined;
  if (/sephora\./.test(url.hostname)) return `https://www.sephora.com/productimages/sku/s${sku}-main-zoom.jpg`;
  if (/ulta\./.test(url.hostname)) return `https://media.ulta.com/i/ulta/${sku}?w=600`;
  return undefined;
}

export async function isImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(6000) });
    return res.ok && (res.headers.get("content-type") ?? "").startsWith("image/");
  } catch {
    return false;
  }
}

export async function findProductPage(p: Product): Promise<ProductLink | null> {
  const res = await new OpenAI().responses.create({
    model: OPENAI_MODEL,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    input: `Search the web for the product page of "${p.brand} ${p.name}" in shade "${p.shade}". ` +
      "List up to 3 product page URLs you actually found in the search results, best match first (Sephora, Ulta, Target, " +
      "Walmart or the brand's own store). Prefer the URL that opens that exact shade (a shade or variant URL, or its " +
      "skuId=/variant=/color= parameter) when the store has one. One URL per line, nothing else.",
  });
  const candidates = [...res.output_text.matchAll(/https?:\/\/[^\s)>\]"']+/g)].map((m) => m[0]);
  for (const raw of candidates) {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      continue;
    }
    if (/amazon\./.test(url.hostname)) continue;
    const page = await inspect(url.href);
    if (!page.alive) continue;
    const sku = skuImage(url);
    const image = sku && (await isImage(sku)) ? sku : page.image;
    return { url: url.href, store: storeOf(url, p.brand), image };
  }
  return null;
}
