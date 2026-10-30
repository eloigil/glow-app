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

function storeOf(url: URL, brand: string): string {
  return STORES.find(([re]) => re.test(url.hostname))?.[1] ?? brand;
}

/** The URL must load (redirects followed). 403 counts as alive: big retailers block bots but the page exists. */
async function loads(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh) GlowApp link check", Accept: "text/html" },
      signal: AbortSignal.timeout(6000),
    });
    return res.ok || res.status === 403;
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
      "Walmart or the brand's own store), one per line, nothing else.",
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
    if (await loads(url.href)) return { url: url.href, store: storeOf(url, p.brand) };
  }
  return null;
}
