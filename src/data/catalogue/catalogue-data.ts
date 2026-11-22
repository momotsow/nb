// Catalogue read queries. Only this module touches Prisma for catalogue reads.
// Raw SQL is limited to FTS and price ordering and is always parameterised via
// tagged templates (R9.1); no string concatenation of user input.
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "@/generated/prisma/client";
import type {
  CatalogueData,
  CategoryPage,
  CollectionPage,
  ImageRow,
  ListParams,
  Page,
  ProductDetailRow,
  ProductListRow,
  ProductStockKeysRow,
  SitemapRows,
  VariantRow,
  VariantWithProductRow,
} from "./types";

/** R1.4: ACTIVE product with at least one active variant. */
const VISIBLE = {
  status: "ACTIVE",
  variants: { some: { active: true } },
} satisfies Prisma.ProductWhereInput;

const variantSelect = {
  id: true,
  sku: true,
  name: true,
  priceCents: true,
  stockKey: true,
  active: true,
} satisfies Prisma.ProductVariantSelect;

const imageSelect = { mediaRef: true, alt: true } satisfies Prisma.ProductImageSelect;
const imageOrder = [
  { sortOrder: "asc" },
  { id: "asc" },
] satisfies Prisma.ProductImageOrderByWithRelationInput[];

const listSelect = {
  id: true,
  slug: true,
  name: true,
  shortDesc: true,
  featured: true,
  status: true,
  categoryId: true,
  createdAt: true,
  variants: {
    where: { active: true },
    orderBy: [{ priceCents: "asc" }, { id: "asc" }],
    select: variantSelect,
  },
  images: { orderBy: imageOrder, take: 1, select: imageSelect },
} satisfies Prisma.ProductSelect;

type ListPayload = Prisma.ProductGetPayload<{ select: typeof listSelect }>;

const detailSelect = {
  ...listSelect,
  description: true,
  story: true,
  ingredients: true,
  scentNotes: true,
  directions: true,
  safetyInfo: true,
  warnings: true,
  benefits: true,
  seoTitle: true,
  seoDescription: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  images: { orderBy: imageOrder, select: imageSelect },
  attributes: { orderBy: [{ key: "asc" }, { value: "asc" }], select: { key: true, value: true } },
  collections: {
    where: { collection: { published: true } },
    orderBy: [{ sortOrder: "asc" }, { collectionId: "asc" }],
    select: { collection: { select: { id: true, name: true, slug: true } } },
  },
  related: {
    where: { to: VISIBLE },
    orderBy: { toId: "asc" },
    select: { to: { select: listSelect } },
  },
} satisfies Prisma.ProductSelect;

type DetailPayload = Prisma.ProductGetPayload<{ select: typeof detailSelect }>;

const variantRow = (v: VariantRow): VariantRow => ({
  id: v.id,
  sku: v.sku,
  name: v.name,
  priceCents: v.priceCents,
  stockKey: v.stockKey,
  active: v.active,
});

const imageRow = (i: ImageRow): ImageRow => ({ mediaRef: i.mediaRef, alt: i.alt });

function toListRow(p: ListPayload): ProductListRow {
  const hero = p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDesc: p.shortDesc,
    featured: p.featured,
    status: p.status,
    categoryId: p.categoryId,
    createdAt: p.createdAt,
    variants: p.variants.map(variantRow),
    heroImage: hero ? imageRow(hero) : null,
  };
}

function toDetailRow(p: DetailPayload): ProductDetailRow {
  return {
    ...toListRow({ ...p, images: p.images.slice(0, 1) }),
    description: p.description,
    story: p.story,
    ingredients: p.ingredients,
    scentNotes: p.scentNotes,
    directions: p.directions,
    safetyInfo: p.safetyInfo,
    warnings: p.warnings,
    benefits: p.benefits,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    updatedAt: p.updatedAt,
    category: p.category
      ? { id: p.category.id, name: p.category.name, slug: p.category.slug }
      : null,
    images: p.images.map(imageRow),
    attributes: p.attributes.map((a) => ({ key: a.key, value: a.value })),
    collections: p.collections.map((c) => ({
      id: c.collection.id,
      name: c.collection.name,
      slug: c.collection.slug,
    })),
    related: p.related.map((r) => toListRow(r.to)),
  };
}

function listWhere(
  params: Pick<ListParams, "categorySlug" | "collectionSlug">,
): Prisma.ProductWhereInput {
  return {
    ...VISIBLE,
    ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
    ...(params.collectionSlug
      ? { collections: { some: { collection: { slug: params.collectionSlug, published: true } } } }
      : {}),
  };
}

function offset(page: number, pageSize: number): number {
  return (Math.max(1, Math.trunc(page)) - 1) * pageSize;
}

/** Re-order fetched rows to match the id order produced by a ranking query. */
function inIdOrder(ids: readonly string[], rows: readonly ProductListRow[]): ProductListRow[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [row] : [];
  });
}

export function buildCatalogueData(db: PrismaClient): CatalogueData {
  async function fetchByIds(ids: readonly string[]): Promise<ProductListRow[]> {
    if (ids.length === 0) return [];
    const rows = await db.product.findMany({
      where: { ...VISIBLE, id: { in: [...ids] } },
      select: listSelect,
    });
    return inIdOrder(ids, rows.map(toListRow));
  }

  /** Price ordering needs MIN over active variants, which Prisma cannot order by. */
  async function idsByPrice(params: ListParams): Promise<string[]> {
    const skip = offset(params.page, params.pageSize);
    const category = params.categorySlug ?? null;
    const collection = params.collectionSlug ?? null;
    const rows =
      params.sort === "price_asc"
        ? await db.$queryRaw<{ id: string }[]>`
            SELECT p."id"
            FROM "Product" p
            JOIN "ProductVariant" v ON v."productId" = p."id" AND v."active"
            WHERE p."status" = 'ACTIVE'::"ProductStatus"
              AND (${category}::text IS NULL OR EXISTS (
                SELECT 1 FROM "Category" c WHERE c."id" = p."categoryId" AND c."slug" = ${category}::text))
              AND (${collection}::text IS NULL OR EXISTS (
                SELECT 1 FROM "ProductCollection" pc JOIN "Collection" col ON col."id" = pc."collectionId"
                WHERE pc."productId" = p."id" AND col."slug" = ${collection}::text AND col."published"))
            GROUP BY p."id"
            ORDER BY MIN(v."priceCents") ASC, p."id" ASC
            LIMIT ${params.pageSize} OFFSET ${skip}`
        : await db.$queryRaw<{ id: string }[]>`
            SELECT p."id"
            FROM "Product" p
            JOIN "ProductVariant" v ON v."productId" = p."id" AND v."active"
            WHERE p."status" = 'ACTIVE'::"ProductStatus"
              AND (${category}::text IS NULL OR EXISTS (
                SELECT 1 FROM "Category" c WHERE c."id" = p."categoryId" AND c."slug" = ${category}::text))
              AND (${collection}::text IS NULL OR EXISTS (
                SELECT 1 FROM "ProductCollection" pc JOIN "Collection" col ON col."id" = pc."collectionId"
                WHERE pc."productId" = p."id" AND col."slug" = ${collection}::text AND col."published"))
            GROUP BY p."id"
            ORDER BY MIN(v."priceCents") DESC, p."id" ASC
            LIMIT ${params.pageSize} OFFSET ${skip}`;
    return rows.map((r) => r.id);
  }

  async function listProducts(params: ListParams): Promise<Page<ProductListRow>> {
    const where = listWhere(params);
    const total = await db.product.count({ where });
    if (total === 0) return { rows: [], total };

    if (params.sort === "price_asc" || params.sort === "price_desc") {
      const ids = await idsByPrice(params);
      return { rows: await fetchByIds(ids), total };
    }
    const orderBy: Prisma.ProductOrderByWithRelationInput[] =
      params.sort === "newest"
        ? [{ createdAt: "desc" }, { id: "asc" }]
        : [{ featured: "desc" }, { createdAt: "desc" }, { id: "asc" }];
    const rows = await db.product.findMany({
      where,
      orderBy,
      skip: offset(params.page, params.pageSize),
      take: params.pageSize,
      select: listSelect,
    });
    return { rows: rows.map(toListRow), total };
  }

  async function getProductBySlug(slug: string): Promise<ProductDetailRow | null> {
    const p = await db.product.findFirst({ where: { ...VISIBLE, slug }, select: detailSelect });
    return p ? toDetailRow(p) : null;
  }

  async function getCollectionBySlug(
    slug: string,
    params: Omit<ListParams, "collectionSlug">,
  ): Promise<CollectionPage | null> {
    const c = await db.collection.findFirst({ where: { slug, published: true } });
    if (!c) return null;
    const page = await listProducts({ ...params, collectionSlug: slug });
    return {
      ...page,
      collection: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        tagline: c.tagline,
        story: c.story,
        mediaRef: c.mediaRef,
        sortOrder: c.sortOrder,
        published: c.published,
      },
    };
  }

  async function getCategoryBySlug(
    slug: string,
    params: Omit<ListParams, "categorySlug">,
  ): Promise<CategoryPage | null> {
    const c = await db.category.findUnique({ where: { slug } });
    if (!c) return null;
    const page = await listProducts({ ...params, categorySlug: slug });
    return { ...page, category: { id: c.id, name: c.name, slug: c.slug } };
  }

  async function getVariantsByIds(
    ids: readonly string[],
  ): Promise<readonly VariantWithProductRow[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const rows = await db.productVariant.findMany({
      where: { id: { in: unique } },
      select: {
        ...variantSelect,
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            images: { orderBy: imageOrder, take: 1, select: imageSelect },
          },
        },
      },
    });
    return rows.map((v) => {
      const hero = v.product.images[0];
      return {
        ...variantRow(v),
        productId: v.product.id,
        productName: v.product.name,
        productSlug: v.product.slug,
        productStatus: v.product.status,
        heroImage: hero ? imageRow(hero) : null,
      };
    });
  }

  async function searchProducts(
    query: string,
    page: number,
    pageSize: number,
  ): Promise<Page<ProductListRow>> {
    const q = query.trim();
    if (q === "") return { rows: [], total: 0 };
    const skip = offset(page, pageSize);
    // websearch_to_tsquery never raises on user syntax. Rank by weighted vector.
    const hits = await db.$queryRaw<{ id: string; total: bigint }[]>`
      SELECT p."id", COUNT(*) OVER () AS "total"
      FROM "Product" p
      WHERE p."status" = 'ACTIVE'::"ProductStatus"
        AND EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id" AND v."active")
        AND p."searchVector" @@ websearch_to_tsquery('english', ${q}::text)
      ORDER BY ts_rank(p."searchVector", websearch_to_tsquery('english', ${q}::text)) DESC, p."id" ASC
      LIMIT ${pageSize} OFFSET ${skip}`;
    const total = hits[0] ? Number(hits[0].total) : 0;
    if (hits.length === 0 && skip > 0) {
      // Page beyond the end: report the true total without a second ranking query.
      const [{ n } = { n: BigInt(0) }] = await db.$queryRaw<{ n: bigint }[]>`
        SELECT COUNT(*) AS "n" FROM "Product" p
        WHERE p."status" = 'ACTIVE'::"ProductStatus"
          AND EXISTS (SELECT 1 FROM "ProductVariant" v WHERE v."productId" = p."id" AND v."active")
          AND p."searchVector" @@ websearch_to_tsquery('english', ${q}::text)`;
      return { rows: [], total: Number(n) };
    }
    return { rows: await fetchByIds(hits.map((h) => h.id)), total };
  }

  async function getStockKeysByProductIds(
    ids: readonly string[],
  ): Promise<readonly ProductStockKeysRow[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const rows = await db.productVariant.findMany({
      where: { productId: { in: unique }, active: true },
      select: { productId: true, stockKey: true },
      orderBy: [{ productId: "asc" }, { id: "asc" }],
    });
    const byProduct = new Map<string, string[]>();
    for (const r of rows) {
      const list = byProduct.get(r.productId) ?? [];
      list.push(r.stockKey);
      byProduct.set(r.productId, list);
    }
    return [...byProduct].map(([productId, stockKeys]) => ({ productId, stockKeys }));
  }

  async function listSitemapRows(): Promise<SitemapRows> {
    const [products, collections, categories] = await Promise.all([
      db.product.findMany({
        where: VISIBLE,
        orderBy: { slug: "asc" },
        select: { slug: true, updatedAt: true },
      }),
      db.collection.findMany({
        where: { published: true },
        orderBy: { slug: "asc" },
        select: { slug: true },
      }),
      db.category.findMany({
        where: { products: { some: VISIBLE } },
        orderBy: { slug: "asc" },
        select: { slug: true },
      }),
    ]);
    return { products, collections, categories };
  }

  return {
    listProducts,
    listSitemapRows,
    getStockKeysByProductIds,
    getProductBySlug,
    getCollectionBySlug,
    getCategoryBySlug,
    getVariantsByIds,
    searchProducts,
    close: () => db.$disconnect(),
  };
}

export function createCatalogueData(options: { connectionString: string }): CatalogueData {
  const adapter = new PrismaPg({ connectionString: options.connectionString });
  return buildCatalogueData(new PrismaClient({ adapter }));
}
