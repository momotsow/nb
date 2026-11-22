// Plain row types returned by the catalogue data layer. No Prisma types leak out.

export type ProductStatusRow = "DRAFT" | "ACTIVE" | "ARCHIVED";

export type ProductSort = "featured" | "price_asc" | "price_desc" | "newest";

export interface VariantRow {
  readonly id: string;
  readonly sku: string;
  readonly name: string;
  readonly priceCents: number;
  readonly stockKey: string;
  readonly active: boolean;
}

export interface ImageRow {
  readonly mediaRef: string;
  readonly alt: string;
}

export interface ProductListRow {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly shortDesc: string;
  readonly featured: boolean;
  readonly status: ProductStatusRow;
  readonly categoryId: string | null;
  readonly createdAt: Date;
  /** Active variants only, cheapest first. */
  readonly variants: readonly VariantRow[];
  readonly heroImage: ImageRow | null;
}

export interface CategoryRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
}

export interface CollectionRow {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly tagline: string | null;
  readonly story: string | null;
  readonly mediaRef: string | null;
  readonly sortOrder: number;
  readonly published: boolean;
}

export interface AttributeRow {
  readonly key: string;
  readonly value: string;
}

export interface ProductDetailRow extends ProductListRow {
  readonly description: string;
  readonly story: string | null;
  readonly ingredients: string | null;
  readonly scentNotes: string | null;
  readonly directions: string | null;
  readonly safetyInfo: string | null;
  readonly warnings: string | null;
  readonly benefits: string | null;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly updatedAt: Date;
  readonly category: CategoryRow | null;
  readonly images: readonly ImageRow[];
  readonly attributes: readonly AttributeRow[];
  /** Published collections the product belongs to. */
  readonly collections: readonly Pick<CollectionRow, "id" | "name" | "slug">[];
  /** Visible related products only. */
  readonly related: readonly ProductListRow[];
}

export interface ListParams {
  /** 1-based. */
  readonly page: number;
  readonly pageSize: number;
  readonly sort: ProductSort;
  readonly categorySlug?: string;
  readonly collectionSlug?: string;
}

export interface Page<T> {
  readonly rows: readonly T[];
  readonly total: number;
}

export interface CollectionPage extends Page<ProductListRow> {
  readonly collection: CollectionRow;
}

export interface CategoryPage extends Page<ProductListRow> {
  readonly category: CategoryRow;
}

/** Variant with the product facts needed to decide purchasability. Not visibility-filtered. */
export interface VariantWithProductRow extends VariantRow {
  readonly productId: string;
  readonly productName: string;
  readonly productSlug: string;
  readonly productStatus: ProductStatusRow;
  readonly heroImage: ImageRow | null;
}

export interface ProductStockKeysRow {
  readonly productId: string;
  readonly stockKeys: readonly string[];
}

/** Public URL facts for the sitemap: visible products, published collections, non-empty categories. */
export interface SitemapRows {
  readonly products: readonly { readonly slug: string; readonly updatedAt: Date }[];
  readonly collections: readonly { readonly slug: string }[];
  readonly categories: readonly { readonly slug: string }[];
}

export interface CatalogueData {
  listSitemapRows(): Promise<SitemapRows>;
  listProducts(params: ListParams): Promise<Page<ProductListRow>>;
  getProductBySlug(slug: string): Promise<ProductDetailRow | null>;
  getCollectionBySlug(
    slug: string,
    params: Omit<ListParams, "collectionSlug">,
  ): Promise<CollectionPage | null>;
  getCategoryBySlug(
    slug: string,
    params: Omit<ListParams, "categorySlug">,
  ): Promise<CategoryPage | null>;
  getVariantsByIds(ids: readonly string[]): Promise<readonly VariantWithProductRow[]>;
  searchProducts(query: string, page: number, pageSize: number): Promise<Page<ProductListRow>>;
  /** Active variants' stock keys for the given products. Unknown product ids are omitted. */
  getStockKeysByProductIds(ids: readonly string[]): Promise<readonly ProductStockKeysRow[]>;
  close(): Promise<void>;
}
