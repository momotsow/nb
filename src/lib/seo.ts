import type { Metadata, MetadataRoute } from "next";

// Shared crawler configuration. Later specs append to these registries.

/** Paths crawlers must not index. Specs 2-4 append (e.g. checkout sub-routes). */
export const ROBOTS_DISALLOW: string[] = ["/search", "/cart", "/checkout"];

export type SitemapSource = () => MetadataRoute.Sitemap | Promise<MetadataRoute.Sitemap>;

/** Registered sitemap sources. Foundation registers none; Specs 2+ push theirs. */
export const SITEMAP_SOURCES: SitemapSource[] = [];

/** Absolute site origin without trailing slash. Reads APP_URL directly so the shell needs no DB config. */
export function siteUrl(): string {
  const raw = process.env.APP_URL;
  return (raw && raw.trim() !== "" ? raw : "http://localhost:3000").replace(/\/+$/, "");
}

export function buildRobots(
  disallow: readonly string[] = ROBOTS_DISALLOW,
  base: string = siteUrl(),
): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: [...disallow] }],
    sitemap: `${base}/sitemap.xml`,
  };
}

export async function buildSitemap(
  sources: readonly SitemapSource[] = SITEMAP_SOURCES,
  base: string = siteUrl(),
): Promise<MetadataRoute.Sitemap> {
  const registered = await Promise.all(sources.map((s) => s()));
  return [{ url: `${base}/`, changeFrequency: "weekly", priority: 1 }, ...registered.flat()];
}

/**
 * Canonical URL: site origin plus path. Filters and sort are never part of it; only `page`
 * is kept, and only beyond the first page (page 1 is the bare path).
 */
export function canonicalUrl(path: string, options: { page?: number; base?: string } = {}): string {
  const base = options.base ?? siteUrl();
  const url = `${base}${path}`;
  const page = options.page;
  return page !== undefined && Number.isInteger(page) && page > 1 ? `${url}?page=${page}` : url;
}

export interface PageMetadataInput {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly page?: number;
  readonly image?: { readonly url: string; readonly alt: string } | null;
  readonly noindex?: boolean;
}

/**
 * Title, description, canonical, Open Graph and Twitter card for one route. Relative image URLs
 * are resolved against `metadataBase` from the root layout. When there is no image, the root
 * layout provides none either, so the card falls back to a text-only summary.
 */
export function buildPageMetadata(input: PageMetadataInput): Metadata {
  const { title, description, path, page, image, noindex } = input;
  const url = canonicalUrl(path, page === undefined ? {} : { page });
  const images = image ? [{ url: image.url, alt: image.alt }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      siteName: "Ndalo Bloom",
      locale: "en_ZA",
      title,
      description,
      url,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      ...(images ? { images } : {}),
    },
  };
}

/** Appends "(page N)" past page 1 so titles stay unique across paginated URLs. */
export function pagedTitle(title: string, page: number): string {
  return page > 1 ? `${title} (page ${page})` : title;
}

/** Collapses whitespace and trims to a snippet length suited to search and share previews. */
export function toSnippet(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1).trimEnd()}…`;
}

/**
 * JSON for an inline `<script type="application/ld+json">`. `<` is escaped so no field value can
 * close the script element or open a comment; U+2028/2029 are escaped for older parsers.
 */
export function serialiseJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
