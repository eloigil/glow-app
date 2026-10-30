"use client";

import { useEffect } from "react";
import { postJson } from "@/lib/postJson";
import { useSession, type Session } from "@/lib/session";
import { productKey } from "@/lib/shop";
import type { Look, ProductLink, ProductsResponse, Step } from "@/lib/types";

// One background request per photo + plan, even if she leaves /looks mid-search.
const inflight = new Set<string>();

/** Finds exact product pages for every look's products in the background; silent on failure. */
export function useProductLinks(looks: Look[] | undefined, fileId: string | undefined) {
  const { session, setSession } = useSession();
  useEffect(() => {
    if (!looks?.length || !fileId) return;
    const key = `${fileId}:${looks.map((l) => l.name).join("|")}`;
    if (inflight.has(key)) return;
    inflight.add(key);
    // Older saved looks have no product. Pages already found (e.g. restored from the device) are not searched again.
    const products = looks
      .flatMap((l) => l.steps.map((s) => s.product as Step["product"] | undefined))
      .filter((p) => !!p && session.productLinks?.[productKey(p)] === undefined);
    if (!products.length) return;
    setSession((s) => ({ ...s, productLinksPending: true }));
    postJson<ProductsResponse>("/api/products", { products })
      .then((body) => setSession((s) => ({ ...s, productLinks: { ...s.productLinks, ...body.links } })))
      .catch(() => undefined)
      .finally(() => setSession((s) => ({ ...s, productLinksPending: false })));
    // Run once per set of looks; known links are only read to skip them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [looks, fileId, setSession]);
}

/** The exact page for a step's product: a link, null when none was found, undefined while still searching. */
export function linkFor(session: Session, step: Step): ProductLink | null | undefined {
  const p = step.product as Step["product"] | undefined;
  if (!p) return null;
  const link = session.productLinks?.[productKey(p)];
  if (link !== undefined) return link;
  return session.productLinksPending ? undefined : null;
}
