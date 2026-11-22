// Catalogue SEO: metadata inputs per route, Product/Offer JSON-LD and the sitemap source.
// Pure functions over read models so they can be snapshot-tested without a server.
import type {
  CategoryView,
  CollectionView,
  MediaViewModel,
  ProductDetailView,
} from "@/application/catalogue";
import type { Availability } from "@/domain/catalogue/catalogue";
import { buildPageMetadata, canonicalUrl, pagedTitle, siteUrl, toSnippet } from "@/lib/seo";

const SHOP_DESCRIPTION =
  "Browse Ndalo Bloom self-care products and gifts, with clear prices and availability.";

const image = (m: MediaViewModel | null | undefined) =>
  m ? { url: m.mediaRef, alt: m.alt } : null;

export function shopMetadata(page: number) {
  return buildPageMetadata({
    title: pagedTitle("Shop", page),
    description: SHOP_DESCRIPTION,
    path: "/shop",
    page,
  });
}

export function collectionMetadata(view: CollectionView, page: number) {
  const c = view.collection;
  const description = toSnippet(
    c.tagline || c.story || `Explore the ${c.name} collection from Ndalo Bloom.`,
  );
  return buildPageMetadata({
    title: pagedTitle(c.name, page),
    description,
    path: `/collections/${c.slug}`,
    page,
    image: image(c.hero) ?? image(view.products.items[0]?.hero),
  });
}

export function categoryMetadata(view: CategoryView, page: number) {
  const { name, slug } = view.category;
  return buildPageMetadata({
    title: pagedTitle(name, page),
    description: `Shop ${name} from Ndalo Bloom, with clear prices and availability.`,
    path: `/categories/${slug}`,
    page,
    image: image(view.products.items[0]?.hero),
  });
}

export function productMetadata(product: ProductDetailView) {
  return buildPageMetadata({
    title: product.seoTitle?.trim() || product.name,
    description: toSnippet(
      product.seoDescription?.trim() || product.shortDesc || product.description,
    ),
    path: `/products/${product.slug}`,
    image: image(product.images[0]),
  });
}

export function searchMetadata() {
  return buildPageMetadata({
    title: "Search",
    description: "Search Ndalo Bloom products by name, description or scent notes.",
    path: "/search",
    noindex: true,
  });
}

const SCHEMA_AVAILABILITY: Record<Availability, string> = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/InStock",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
};

/** Integer cents to a decimal string without floating point: 12950 -> "129.50". */
function decimalPrice(priceCents: number): string {
  return `${Math.trunc(priceCents / 100)}.${String(priceCents % 100).padStart(2, "0")}`;
}

/**
 * schema.org Product with one Offer per variant. Prices come from the catalogue (ZAR) and
 * availability from the caller, which reads it fresh from the provider. No review or rating data.
 */
export function productJsonLd(
  product: ProductDetailView,
  availability: ReadonlyMap<string, Availability>,
  base: string = siteUrl(),
) {
  const url = canonicalUrl(`/products/${product.slug}`, { base });
  const absolute = (ref: string) => (ref.startsWith("/") ? `${base}${ref}` : ref);
  const description = product.shortDesc || product.description;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url,
    ...(description ? { description } : {}),
    ...(product.images.length > 0
      ? { image: product.images.map((i) => absolute(i.mediaRef)) }
      : {}),
    ...(product.category ? { category: product.category.name } : {}),
    brand: { "@type": "Brand", name: "Ndalo Bloom" },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.name || product.name,
      url,
      price: decimalPrice(v.priceCents),
      priceCurrency: "ZAR",
      availability: SCHEMA_AVAILABILITY[availability.get(v.id) ?? "OUT_OF_STOCK"],
    })),
  };
}
