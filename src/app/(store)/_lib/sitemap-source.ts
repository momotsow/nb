import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { catalogueReads } from "@/application/catalogue/runtime";
import { canonicalUrl, type SitemapSource } from "@/lib/seo";

/** Sitemap source: active product, published collection and category URLs. */
export const catalogueSitemapSource: SitemapSource = async (): Promise<MetadataRoute.Sitemap> => {
  // Request-time only: the build must not need a database.
  await connection();
  const entries = await catalogueReads().listSitemapEntries();
  const at = (path: string) => canonicalUrl(path);
  return [
    { url: at("/shop"), changeFrequency: "daily" as const },
    ...entries.collectionSlugs.map((slug) => ({ url: at(`/collections/${slug}`) })),
    ...entries.categorySlugs.map((slug) => ({ url: at(`/categories/${slug}`) })),
    ...entries.products.map((p) => ({
      url: at(`/products/${p.slug}`),
      lastModified: p.updatedAt,
    })),
  ];
};
