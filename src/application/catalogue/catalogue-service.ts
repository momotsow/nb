import type {
  CatalogueData,
  ImageRow,
  ListParams,
  Page,
  ProductListRow,
} from "@/data/catalogue/types";
import {
  bestAvailability,
  isProductVisible,
  isPurchasable,
  priceRange,
  selectDefaultVariant,
  type Availability,
} from "@/domain/catalogue/catalogue";
import type { FailClosedAvailability } from "@/integrations/availability/provider";
import type { MediaProvider } from "@/integrations/media/media-provider";
import {
  cartVariantFactsSchema,
  categoryViewSchema,
  collectionViewSchema,
  productDetailSchema,
  productListViewSchema,
  searchViewSchema,
  type CartVariantFacts,
  type CategoryView,
  type CollectionView,
  type MediaViewModel,
  type ProductDetailView,
  type ProductListView,
  type ProductSummary,
  type SearchView,
} from "./views";

export type ProductSort = ListParams["sort"];

export interface ListQuery {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
  readonly sort: ProductSort;
  readonly categorySlug?: string;
}

export interface CatalogueService {
  listProducts(q: ListQuery): Promise<ProductListView>;
  /** null => caller renders notFound(). */
  getProduct(slug: string): Promise<ProductDetailView | null>;
  getCollection(slug: string, q: Omit<ListQuery, "categorySlug">): Promise<CollectionView | null>;
  getCategory(slug: string, q: Omit<ListQuery, "categorySlug">): Promise<CategoryView | null>;
  search(q: string, page: number, pageSize?: number): Promise<SearchView>;
  /** Single trusted read path for cart and checkout. Unknown ids are omitted. */
  getVariantsForCart(ids: readonly string[]): Promise<CartVariantFacts[]>;
  /**
   * Fresh availability per product (best of its active variants), one batch provider call.
   * Routes call this outside the cache so stock is never cached with product data.
   */
  getProductsAvailability(ids: readonly string[]): Promise<ProductsAvailability>;
  /** Fresh per-variant availability and purchasability. Unknown ids are omitted. */
  getVariantsAvailability(ids: readonly string[]): Promise<VariantsAvailability>;
  /** Public catalogue URLs for the sitemap: active products, published collections, categories. */
  listSitemapEntries(): Promise<SitemapEntries>;
}

export interface SitemapEntries {
  readonly products: readonly { readonly slug: string; readonly updatedAt: Date }[];
  readonly collectionSlugs: readonly string[];
  readonly categorySlugs: readonly string[];
}

export interface VariantsAvailability {
  readonly byVariantId: ReadonlyMap<
    string,
    { readonly availability: Availability; readonly isPurchasable: boolean }
  >;
  readonly degraded: boolean;
}

export interface ProductsAvailability {
  readonly byProductId: ReadonlyMap<string, Availability>;
  /** True when the provider failed and every product was forced to OUT_OF_STOCK. */
  readonly degraded: boolean;
}

export interface CatalogueServiceDeps {
  readonly data: CatalogueData;
  readonly availability: FailClosedAvailability;
  readonly media: MediaProvider;
}

const DEFAULT_SEARCH_PAGE_SIZE = 12;

export function createCatalogueService(deps: CatalogueServiceDeps): CatalogueService {
  const { data, availability, media } = deps;

  const toMedia = (img: ImageRow | null): MediaViewModel | null =>
    img ? media.toView(img.mediaRef, img.alt) : null;

  const pageCount = (total: number, pageSize: number) => Math.ceil(total / pageSize);

  async function summarise(
    rows: readonly ProductListRow[],
  ): Promise<{ items: ProductSummary[]; degraded: boolean }> {
    const visible = rows.filter(isProductVisible);
    // One batch call for every key on the page.
    const keys = visible.flatMap((r) => r.variants.filter((v) => v.active).map((v) => v.stockKey));
    const result = await availability.getAvailability(keys);
    return {
      items: visible.map((row) => toSummary(row, result.availability)),
      degraded: result.degraded,
    };
  }

  function toSummary(
    row: ProductListRow,
    stock: ReadonlyMap<string, Availability>,
  ): ProductSummary {
    const active = row.variants.filter((v) => v.active);
    const range = priceRange(active);
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      shortDesc: row.shortDesc,
      featured: row.featured,
      priceFromCents: range?.min ?? 0,
      priceIsRange: range?.isRange ?? false,
      availability: bestAvailability(active.map((v) => stock.get(v.stockKey))),
      hero: toMedia(row.heroImage),
    };
  }

  async function toListView(
    page: Page<ProductListRow>,
    q: { page: number; pageSize: number },
  ): Promise<ProductListView> {
    const { items, degraded } = await summarise(page.rows);
    return productListViewSchema.parse({
      items,
      page: q.page,
      pageSize: q.pageSize,
      total: page.total,
      pageCount: pageCount(page.total, q.pageSize),
      availabilityDegraded: degraded,
    });
  }

  return {
    async listSitemapEntries() {
      const rows = await data.listSitemapRows();
      return {
        products: rows.products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt })),
        collectionSlugs: rows.collections.map((c) => c.slug),
        categorySlugs: rows.categories.map((c) => c.slug),
      };
    },

    async listProducts(q) {
      const page = await data.listProducts({
        page: q.page,
        pageSize: q.pageSize,
        sort: q.sort,
        ...(q.categorySlug ? { categorySlug: q.categorySlug } : {}),
      });
      return toListView(page, q);
    },

    async getProduct(slug) {
      const row = await data.getProductBySlug(slug);
      if (!row || !isProductVisible(row)) return null;

      const activeVariants = row.variants.filter((v) => v.active);
      const relatedVisible = row.related.filter(isProductVisible);
      const keys = [
        ...activeVariants.map((v) => v.stockKey),
        ...relatedVisible.flatMap((r) => r.variants.filter((v) => v.active).map((v) => v.stockKey)),
      ];
      const { availability: stock, degraded } = await availability.getAvailability(keys);

      const stockById = new Map<string, Availability>(
        activeVariants.map((v) => [v.id, stock.get(v.stockKey) ?? "OUT_OF_STOCK"]),
      );
      const def = selectDefaultVariant(row.status, activeVariants, stockById);
      if (!def) return null;
      const range = priceRange(activeVariants);

      return productDetailSchema.parse({
        id: row.id,
        slug: row.slug,
        name: row.name,
        shortDesc: row.shortDesc,
        description: row.description,
        story: row.story,
        ingredients: row.ingredients,
        scentNotes: row.scentNotes,
        directions: row.directions,
        safetyInfo: row.safetyInfo,
        warnings: row.warnings,
        benefits: row.benefits,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        updatedAt: row.updatedAt.toISOString(),
        category: row.category ? { name: row.category.name, slug: row.category.slug } : null,
        collections: row.collections.map((c) => ({ name: c.name, slug: c.slug })),
        images: row.images.map((i) => media.toView(i.mediaRef, i.alt)),
        attributes: row.attributes.map((a) => ({ key: a.key, value: a.value })),
        variants: activeVariants.map((v) => {
          const a = stockById.get(v.id) ?? "OUT_OF_STOCK";
          return {
            id: v.id,
            sku: v.sku,
            name: v.name,
            priceCents: v.priceCents,
            availability: a,
            isPurchasable: isPurchasable(row.status, v, a),
          };
        }),
        defaultVariantId: def.id,
        priceFromCents: range?.min ?? 0,
        priceIsRange: range?.isRange ?? false,
        availability: bestAvailability([...stockById.values()]),
        related: relatedVisible.map((r) => toSummary(r, stock)),
        availabilityDegraded: degraded,
      });
    },

    async getCollection(slug, q) {
      const result = await data.getCollectionBySlug(slug, q);
      if (!result || !result.collection.published) return null;
      const c = result.collection;
      return collectionViewSchema.parse({
        collection: {
          slug: c.slug,
          name: c.name,
          tagline: c.tagline,
          story: c.story,
          hero: c.mediaRef ? media.toView(c.mediaRef, c.name) : null,
        },
        products: await toListView(result, q),
      });
    },

    async getCategory(slug, q) {
      const result = await data.getCategoryBySlug(slug, q);
      if (!result) return null;
      return categoryViewSchema.parse({
        category: { name: result.category.name, slug: result.category.slug },
        products: await toListView(result, q),
      });
    },

    async search(query, page, pageSize = DEFAULT_SEARCH_PAGE_SIZE) {
      const trimmed = query.trim();
      if (trimmed === "") {
        return searchViewSchema.parse({
          query: "",
          items: [],
          page,
          pageSize,
          total: 0,
          pageCount: 0,
          availabilityDegraded: false,
        });
      }
      const result = await data.searchProducts(trimmed, page, pageSize);
      const list = await toListView(result, { page, pageSize });
      return searchViewSchema.parse({ ...list, query: trimmed });
    },

    async getProductsAvailability(ids) {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return { byProductId: new Map(), degraded: false };
      const rows = await data.getStockKeysByProductIds(unique);
      const { availability: stock, degraded } = await availability.getAvailability(
        rows.flatMap((r) => r.stockKeys),
      );
      const byProductId = new Map<string, Availability>();
      for (const id of unique) {
        const row = rows.find((r) => r.productId === id);
        byProductId.set(id, bestAvailability((row?.stockKeys ?? []).map((k) => stock.get(k))));
      }
      return { byProductId, degraded };
    },

    async getVariantsAvailability(ids) {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return { byVariantId: new Map(), degraded: false };
      const rows = await data.getVariantsByIds(unique);
      const { availability: stock, degraded } = await availability.getAvailability(
        rows.map((r) => r.stockKey),
      );
      const byVariantId = new Map<string, { availability: Availability; isPurchasable: boolean }>();
      for (const r of rows) {
        const a = stock.get(r.stockKey) ?? "OUT_OF_STOCK";
        byVariantId.set(r.id, {
          availability: a,
          isPurchasable: isPurchasable(r.productStatus, r, a),
        });
      }
      return { byVariantId, degraded };
    },

    async getVariantsForCart(ids) {
      const unique = [...new Set(ids)];
      if (unique.length === 0) return [];
      const rows = await data.getVariantsByIds(unique);
      const { availability: stock } = await availability.getAvailability(
        rows.map((r) => r.stockKey),
      );
      const byId = new Map(rows.map((r) => [r.id, r]));
      const out: CartVariantFacts[] = [];
      for (const id of unique) {
        const r = byId.get(id);
        if (!r) continue;
        const a = stock.get(r.stockKey) ?? "OUT_OF_STOCK";
        out.push(
          cartVariantFactsSchema.parse({
            variantId: r.id,
            productId: r.productId,
            productName: r.productName,
            variantName: r.name,
            priceCents: r.priceCents,
            availability: a,
            isPurchasable: isPurchasable(r.productStatus, r, a),
            hero: toMedia(r.heroImage),
          }),
        );
      }
      return out;
    },
  };
}
