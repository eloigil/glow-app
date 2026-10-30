import { findProductPage } from "@/lib/openai/productPages";
import { fixtureKey, replayable, ReplayMiss } from "@/lib/replay";
import { productKey } from "@/lib/shop";
import type { ProductLink, ProductsRequest, ProductsResponse } from "@/lib/types";

// Exact product pages for a look plan's products, found by web search after the looks are designed.
export const maxDuration = 120;

const CONCURRENCY = 4;

export async function POST(req: Request) {
  const { products } = (await req.json()) as ProductsRequest;
  if (!Array.isArray(products)) return Response.json({ links: {} } satisfies ProductsResponse, { status: 400 });
  const unique = [...new Map(products.map((p) => [productKey(p), p])).values()];
  const links: Record<string, ProductLink | null> = {};
  let next = 0;
  async function worker() {
    while (next < unique.length) {
      const p = unique[next++];
      const key = productKey(p);
      try {
        links[key] = await replayable(`product/${fixtureKey(key)}`, () => findProductPage(p));
      } catch (err) {
        // A replay miss or a failed search just means no exact link; the Amazon search link still works.
        if (!(err instanceof ReplayMiss)) console.error("[products]", key, err instanceof Error ? err.message : err);
        links[key] = null;
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return Response.json({ links } satisfies ProductsResponse);
}
