// Cached catalogue reads. Product facts only: the service used here has neutral availability
// (see application/catalogue/runtime.ts), so no stock value is ever stored in these entries.
// Fresh availability is read per request, inside Suspense, by the route components.
//
// Next docs checked: 'use cache' (file level makes every export a cached async function),
// cacheTag (on-demand invalidation via the 'catalogue' tag) and cacheLife ('minutes' profile,
// called inside each function so the lifetime is explicit at the call site).
"use cache";

import { cacheLife, cacheTag } from "next/cache";
import type { ListQuery } from "@/application/catalogue";
import { catalogueReads } from "@/application/catalogue/runtime";

type PagedQuery = Omit<ListQuery, "categorySlug">;

export async function readShop(q: ListQuery) {
  cacheTag("catalogue");
  cacheLife("minutes");
  return catalogueReads().listProducts(q);
}

export async function readCollection(slug: string, q: PagedQuery) {
  cacheTag("catalogue", `collection:${slug}`);
  cacheLife("minutes");
  return catalogueReads().getCollection(slug, q);
}

export async function readCategory(slug: string, q: PagedQuery) {
  cacheTag("catalogue", `category:${slug}`);
  cacheLife("minutes");
  return catalogueReads().getCategory(slug, q);
}

export async function readProduct(slug: string) {
  cacheTag("catalogue", `product:${slug}`);
  cacheLife("minutes");
  return catalogueReads().getProduct(slug);
}
