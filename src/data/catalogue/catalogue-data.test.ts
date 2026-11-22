// Integration tests against a real Postgres with the catalogue_init migration applied.
// Opt-in: set TEST_DATABASE_URL (CI db-verification job does). Never reads DATABASE_URL so a
// developer's real database is never written to by accident. All rows use a unique prefix
// and are removed afterwards.
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { buildCatalogueData } from "./catalogue-data";
import type { CatalogueData } from "./types";

const url = process.env.TEST_DATABASE_URL;
const P = `t${Date.now().toString(36)}-`;
const id = (s: string) => `${P}${s}`;

describe.skipIf(!url)("catalogue data layer (postgres)", () => {
  let db: PrismaClient;
  let data: CatalogueData;

  const product = (
    key: string,
    over: Partial<{
      status: "DRAFT" | "ACTIVE" | "ARCHIVED";
      name: string;
      shortDesc: string;
      scentNotes: string;
      featured: boolean;
      categoryId: string;
      createdAt: Date;
    }> = {},
  ) =>
    db.product.create({
      data: {
        id: id(key),
        slug: id(key),
        name: over.name ?? `Name ${key}`,
        shortDesc: over.shortDesc ?? "A calm everyday item",
        description: "Description",
        status: over.status ?? "ACTIVE",
        featured: over.featured ?? false,
        scentNotes: over.scentNotes,
        categoryId: over.categoryId,
        createdAt: over.createdAt,
      },
    });

  const variant = (key: string, productKey: string, priceCents: number, active = true) =>
    db.productVariant.create({
      data: {
        id: id(key),
        productId: id(productKey),
        sku: id(`sku-${key}`),
        stockKey: id(`stock-${key}`),
        name: key,
        priceCents,
        active,
      },
    });

  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    data = buildCatalogueData(db);

    await db.category.create({ data: { id: id("cat"), name: "Cat", slug: id("cat") } });
    await db.collection.create({
      data: { id: id("col"), name: "Col", slug: id("col"), published: true },
    });
    await db.collection.create({
      data: { id: id("col-draft"), name: "Hidden", slug: id("col-draft"), published: false },
    });

    await product("a", {
      name: "Lavender Candle",
      scentNotes: "soft lavender and cedar",
      featured: true,
      categoryId: id("cat"),
      createdAt: new Date("2026-01-01"),
    });
    await product("b", {
      name: "Rose Soap",
      categoryId: id("cat"),
      createdAt: new Date("2026-02-01"),
    });
    await product("c", { name: "Draft Lavender", status: "DRAFT" });
    await product("d", { name: "Archived Lavender", status: "ARCHIVED" });
    await product("e", { name: "Lavender No Variants" });
    await product("f", { name: "Lavender Inactive Variant" });

    await variant("a1", "a", 25000);
    await variant("a2", "a", 15000);
    await variant("a3", "a", 5000, false);
    await variant("b1", "b", 9000);
    await variant("c1", "c", 1000);
    await variant("d1", "d", 1000);
    await variant("f1", "f", 1000, false);

    await db.productCollection.createMany({
      data: [
        { productId: id("a"), collectionId: id("col") },
        { productId: id("b"), collectionId: id("col") },
        { productId: id("c"), collectionId: id("col") },
        { productId: id("a"), collectionId: id("col-draft") },
      ],
    });
    await db.productImage.createMany({
      data: [
        { id: id("img2"), productId: id("a"), mediaRef: "m/2", alt: "second", sortOrder: 2 },
        { id: id("img1"), productId: id("a"), mediaRef: "m/1", alt: "first", sortOrder: 1 },
      ],
    });
    await db.relatedProduct.createMany({
      data: [
        { fromId: id("a"), toId: id("b") },
        { fromId: id("a"), toId: id("c") }, // draft: hidden
      ],
    });
    await db.productAttribute.create({
      data: { productId: id("a"), key: "scent", value: "Lavender" },
    });
  });

  afterAll(async () => {
    if (!db) return;
    const like = { startsWith: P };
    await db.product.deleteMany({ where: { id: like } }); // cascades to children
    await db.collection.deleteMany({ where: { id: like } });
    await db.category.deleteMany({ where: { id: like } });
    await data.close();
  });

  const base = { page: 1, pageSize: 24, sort: "featured" } as const;
  const mine = (rows: readonly { id: string }[]) =>
    rows.map((r) => r.id).filter((x) => x.startsWith(P));

  it("lists only ACTIVE products with an active variant (R1.4)", async () => {
    const page = await data.listProducts({ ...base, categorySlug: undefined });
    expect(mine(page.rows).sort()).toEqual([id("a"), id("b")]);
  });

  it("returns only active variants, cheapest first, as plain rows", async () => {
    const page = await data.listProducts(base);
    const a = page.rows.find((r) => r.id === id("a"));
    expect(a?.variants.map((v) => v.priceCents)).toEqual([15000, 25000]);
    expect(a?.heroImage).toEqual({ mediaRef: "m/1", alt: "first" });
    expect(Object.getPrototypeOf(a)).toBe(Object.prototype);
  });

  it("sorts by price asc/desc using the cheapest active variant", async () => {
    const f = { ...base, categorySlug: id("cat") };
    const asc = await data.listProducts({ ...f, sort: "price_asc" });
    const desc = await data.listProducts({ ...f, sort: "price_desc" });
    expect(asc.rows.map((r) => r.id)).toEqual([id("b"), id("a")]); // 9000 < 15000
    expect(desc.rows.map((r) => r.id)).toEqual([id("a"), id("b")]);
  });

  it("sorts newest and featured, and paginates with a stable total", async () => {
    const f = { ...base, categorySlug: id("cat") };
    expect((await data.listProducts({ ...f, sort: "newest" })).rows.map((r) => r.id)).toEqual([
      id("b"),
      id("a"),
    ]);
    expect((await data.listProducts({ ...f, sort: "featured" })).rows[0]?.id).toBe(id("a"));
    const p2 = await data.listProducts({ ...f, pageSize: 1, page: 2 });
    expect(p2.total).toBe(2);
    expect(p2.rows).toHaveLength(1);
  });

  it("returns product detail with ordered images, attributes, published collections, visible related", async () => {
    const d = await data.getProductBySlug(id("a"));
    expect(d?.images.map((i) => i.mediaRef)).toEqual(["m/1", "m/2"]);
    expect(d?.attributes).toEqual([{ key: "scent", value: "Lavender" }]);
    expect(d?.collections.map((c) => c.slug)).toEqual([id("col")]);
    expect(d?.related.map((r) => r.id)).toEqual([id("b")]);
    expect(d?.category?.slug).toBe(id("cat"));
  });

  it.each(["c", "d", "e", "f"])("detail is null for non-visible product %s", async (k) => {
    expect(await data.getProductBySlug(id(k))).toBeNull();
  });

  it("returns a published collection with its visible products only", async () => {
    const col = await data.getCollectionBySlug(id("col"), base);
    expect(col?.collection.slug).toBe(id("col"));
    expect(mine(col?.rows ?? []).sort()).toEqual([id("a"), id("b")]);
    expect(col?.total).toBe(2);
    const priced = await data.getCollectionBySlug(id("col"), { ...base, sort: "price_asc" });
    expect(priced?.rows.map((r) => r.id)).toEqual([id("b"), id("a")]);
  });

  it("returns null for unpublished or unknown collections", async () => {
    expect(await data.getCollectionBySlug(id("col-draft"), base)).toBeNull();
    expect(await data.getCollectionBySlug(id("nope"), base)).toBeNull();
  });

  it("returns a category with its visible products; null when unknown", async () => {
    const cat = await data.getCategoryBySlug(id("cat"), base);
    expect(cat?.rows.map((r) => r.id).sort()).toEqual([id("a"), id("b")]);
    expect(await data.getCategoryBySlug(id("nope"), base)).toBeNull();
  });

  it("fetches variants by id in one call, including inactive ones with product status", async () => {
    const rows = await data.getVariantsByIds([
      id("a1"),
      id("a3"),
      id("c1"),
      id("a1"),
      id("missing"),
    ]);
    const byId = new Map(rows.map((r) => [r.id, r]));
    expect(rows).toHaveLength(3);
    expect(byId.get(id("a1"))).toMatchObject({
      productStatus: "ACTIVE",
      active: true,
      priceCents: 25000,
      stockKey: id("stock-a1"),
      heroImage: { mediaRef: "m/1" },
    });
    expect(byId.get(id("a3"))?.active).toBe(false);
    expect(byId.get(id("c1"))?.productStatus).toBe("DRAFT");
    expect(await data.getVariantsByIds([])).toEqual([]);
  });

  it("searches with full text, ranks name matches, and hides non-visible products (R4.4)", async () => {
    const res = await data.searchProducts("lavender", 1, 24);
    const ids = mine(res.rows);
    expect(ids).toEqual([id("a")]);
    expect(res.total).toBeGreaterThanOrEqual(1);
  });

  it("matches on scent notes and stems words", async () => {
    expect(mine((await data.searchProducts("cedar", 1, 24)).rows)).toEqual([id("a")]);
    expect(mine((await data.searchProducts("candles", 1, 24)).rows)).toEqual([id("a")]);
  });

  it("handles empty, no-result, out-of-range page and operator-like input safely", async () => {
    expect(await data.searchProducts("   ", 1, 24)).toEqual({ rows: [], total: 0 });
    expect((await data.searchProducts("zzzznomatch", 1, 24)).rows).toEqual([]);
    const beyond = await data.searchProducts("lavender", 99, 24);
    expect(beyond.rows).toEqual([]);
    expect(beyond.total).toBeGreaterThanOrEqual(1);
    for (const hostile of [`'; DROP TABLE "Product"; --`, `lavender & | ! ( :*`, `"unbalanced`]) {
      await expect(data.searchProducts(hostile, 1, 24)).resolves.toBeDefined();
    }
    expect(await data.getProductBySlug(id("a"))).not.toBeNull(); // table still intact
  });

  it("treats hostile slugs as data (parameterised)", async () => {
    expect(await data.getProductBySlug(`x' OR '1'='1`)).toBeNull();
    const page = await data.listProducts({
      ...base,
      sort: "price_asc",
      categorySlug: `x' OR '1'='1`,
    });
    expect(page.rows).toEqual([]);
  });
});
