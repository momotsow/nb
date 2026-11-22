import type { MetadataRoute } from "next";
import { catalogueSitemapSource } from "@/app/(store)/_lib/sitemap-source";
import { buildSitemap, SITEMAP_SOURCES } from "@/lib/seo";

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemap([...SITEMAP_SOURCES, catalogueSitemapSource]);
}
