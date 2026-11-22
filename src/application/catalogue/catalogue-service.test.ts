import { describe, expect, it, vi } from "vitest";
import type {
  CatalogueData,
  ProductDetailRow,
  ProductListRow,
  VariantRow,
  VariantWithProductRow,
} from "@/data/catalogue/types";
import {
  withFailClosed,
  type ReadOnlyStockAvailabilityProvider,
} from "@/integrations/availability/provider";
import { createStubAvailabilityProvider } from "@/integrations/availability/stub";
import type { MediaProvider } from "@/integrations/media/media-provider";
import { createCatalogueService } from "./catalogue-service";

const media: MediaProvider = {
  toView: (mediaRef, alt) => ({ mediaRef, alt, width: 800, height: 800 }),
};
const reporter = { capture: vi.fn() };

const variant = (id: string, priceCents: number, over: Partial<VariantRow> = {}): VariantRow => ({
  id,
  sku: `SKU-${id}`,
  name: `Variant ${id}`,
  priceCents,
  stockKey: `k:${id}`,
  active: true,
  ...over,
});

const product = (id: string, over: Partial<ProductListRow> = {}): ProductListRow => ({
  id,
  slug: `p-${id}`,
  name: `Product ${id}`,
  shortDesc: "short",
  featured: false,
  status: "ACTIVE",
  categoryId: null,
  createdAt: new Date("2026-01-01"),
  variants: [variant(`${id}a`, 1000)],
  heroImage: { mediaRef: `ref-${id}`, alt: "alt" },
  ...over,
});

function setup(
  data: Partial<CatalogueData>,
  stock: Record<string, "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"> = {},
  provider?: ReadOnlyStockAvailabilityProvider,
) {
  const stub = createStubAvailabilityProvider(stock);
  const service = createCatalogueService({
    data: data as CatalogueData,
    availability: withFailClosed(provider ?? stub, reporter),
    media,
  });
  return { service, stub };
}

describe("listProducts", () => {
  it("hides non-visible products, passes paging and sort through, and batches availability once", async () => {
    const listProducts = vi.fn().mockResolvedValue({
      total: 25,
      rows: [
        product("1", { variants: [variant("1a", 1000), variant("1b", 2500)] }),
        product("2", { status: "DRAFT" }),
        product("3", { variants: [variant("3a", 500, { active: false })] }),
        product("4"),
      ],
    });
    const { service, stub } = setup({ listProducts }, { "k:1a": "LOW_STOCK", "k:1b": "IN_STOCK" });
    const view = await service.listProducts({ page: 2, pageSize: 10, sort: "price_desc" });

    expect(listProducts).toHaveBeenCalledWith({ page: 2, pageSize: 10, sort: "price_desc" });
    expect(view.items.map((i) => i.id)).toEqual(["1", "4"]);
    expect(view.pageCount).toBe(3);
    expect(view.items[0]).toMatchObject({
      priceFromCents: 1000,
      priceIsRange: true,
      availability: "IN_STOCK",
      hero: { mediaRef: "ref-1", width: 800 },
    });
    expect(view.items[1]?.availability).toBe("OUT_OF_STOCK"); // unknown key fails closed
    expect(stub.calls).toBe(1);
  });

  it("fails closed and flags degradation when the provider throws", async () => {
    const failing: ReadOnlyStockAvailabilityProvider = {
      getAvailability: () => Promise.reject(new Error("down")),
    };
    const { service } = setup(
      { listProducts: vi.fn().mockResolvedValue({ total: 1, rows: [product("1")] }) },
      {},
      failing,
    );
    const view = await service.listProducts({ page: 1, pageSize: 10, sort: "featured" });
    expect(view.availabilityDegraded).toBe(true);
    expect(view.items[0]?.availability).toBe("OUT_OF_STOCK");
  });
});

describe("getProduct", () => {
  const detail = (over: Partial<ProductDetailRow> = {}): ProductDetailRow => ({
    ...product("1", { variants: [variant("1a", 1000), variant("1b", 800)] }),
    description: "desc",
    story: null,
    ingredients: null,
    scentNotes: null,
    directions: null,
    safetyInfo: null,
    warnings: null,
    benefits: null,
    seoTitle: null,
    seoDescription: null,
    updatedAt: new Date("2026-02-01"),
    category: { id: "c", name: "Cat", slug: "cat" },
    images: [{ mediaRef: "img1", alt: "one" }],
    attributes: [{ key: "Size", value: "200ml" }],
    collections: [{ id: "col", name: "Col", slug: "col" }],
    related: [product("9"), product("8", { status: "ARCHIVED" })],
    ...over,
  });

  it("returns null for missing or invisible products", async () => {
    const missing = setup({ getProductBySlug: vi.fn().mockResolvedValue(null) });
    expect(await missing.service.getProduct("x")).toBeNull();
    const draft = setup({
      getProductBySlug: vi.fn().mockResolvedValue(detail({ status: "DRAFT" })),
    });
    expect(await draft.service.getProduct("p-1")).toBeNull();
  });

  it("builds the detail view with default variant, purchasability and visible related only", async () => {
    const { service, stub } = setup(
      { getProductBySlug: vi.fn().mockResolvedValue(detail()) },
      { "k:1a": "IN_STOCK", "k:1b": "OUT_OF_STOCK", "k:9a": "LOW_STOCK" },
    );
    const view = await service.getProduct("p-1");
    expect(view?.defaultVariantId).toBe("1a"); // purchasable beats cheaper out-of-stock
    expect(view?.variants.map((v) => [v.id, v.isPurchasable])).toEqual([
      ["1a", true],
      ["1b", false],
    ]);
    expect(view?.related.map((r) => r.id)).toEqual(["9"]);
    expect(view?.updatedAt).toBe("2026-02-01T00:00:00.000Z");
    expect(stub.calls).toBe(1);
  });
});

describe("collections, categories and search", () => {
  const params = { page: 1, pageSize: 12, sort: "featured" as const };

  it("returns null for unpublished or missing collections", async () => {
    const collection = {
      id: "c",
      name: "C",
      slug: "c",
      tagline: null,
      story: null,
      mediaRef: null,
      sortOrder: 0,
      published: false,
    };
    const { service } = setup({
      getCollectionBySlug: vi
        .fn()
        .mockResolvedValueOnce({ collection, rows: [], total: 0 })
        .mockResolvedValueOnce(null),
    });
    expect(await service.getCollection("c", params)).toBeNull();
    expect(await service.getCollection("zz", params)).toBeNull();
  });

  it("maps a published collection with a MediaView hero", async () => {
    const collection = {
      id: "c",
      name: "C",
      slug: "c",
      tagline: "t",
      story: null,
      mediaRef: "col-ref",
      sortOrder: 0,
      published: true,
    };
    const { service } = setup(
      {
        getCollectionBySlug: vi
          .fn()
          .mockResolvedValue({ collection, rows: [product("1")], total: 1 }),
      },
      { "k:1a": "IN_STOCK" },
    );
    const view = await service.getCollection("c", params);
    expect(view?.collection.hero?.mediaRef).toBe("col-ref");
    expect(view?.products.items).toHaveLength(1);
  });

  it("maps a category", async () => {
    const { service } = setup({
      getCategoryBySlug: vi.fn().mockResolvedValue({
        category: { id: "c", name: "Cat", slug: "cat" },
        rows: [],
        total: 0,
      }),
    });
    const view = await service.getCategory("cat", params);
    expect(view?.category.slug).toBe("cat");
    expect(view?.products.pageCount).toBe(0);
  });

  it("returns an empty view for blank queries without hitting the data layer", async () => {
    const searchProducts = vi.fn();
    const { service } = setup({ searchProducts });
    const view = await service.search("   ", 1);
    expect(view.items).toEqual([]);
    expect(searchProducts).not.toHaveBeenCalled();
  });

  it("searches with the trimmed query", async () => {
    const searchProducts = vi.fn().mockResolvedValue({ total: 1, rows: [product("1")] });
    const { service } = setup({ searchProducts }, { "k:1a": "IN_STOCK" });
    const view = await service.search("  lavender ", 1);
    expect(searchProducts).toHaveBeenCalledWith("lavender", 1, 12);
    expect(view.query).toBe("lavender");
    expect(view.total).toBe(1);
  });
});

describe("getVariantsForCart", () => {
  const row = (id: string, over: Partial<VariantWithProductRow> = {}): VariantWithProductRow => ({
    ...variant(id, 1500),
    productId: `prod-${id}`,
    productName: `Prod ${id}`,
    productSlug: `prod-${id}`,
    productStatus: "ACTIVE",
    heroImage: { mediaRef: `ref-${id}`, alt: "a" },
    ...over,
  });

  it("returns facts in request order with one availability call and correct isPurchasable", async () => {
    const getVariantsByIds = vi
      .fn()
      .mockResolvedValue([
        row("a"),
        row("b", { productStatus: "DRAFT" }),
        row("c", { active: false }),
        row("d"),
        row("e", { heroImage: null }),
      ]);
    const { service, stub } = setup(
      { getVariantsByIds },
      {
        "k:a": "LOW_STOCK",
        "k:b": "IN_STOCK",
        "k:c": "IN_STOCK",
        "k:d": "OUT_OF_STOCK",
        "k:e": "IN_STOCK",
      },
    );
    const facts = await service.getVariantsForCart(["e", "a", "missing", "b", "c", "d", "a"]);

    expect(getVariantsByIds).toHaveBeenCalledWith(["e", "a", "missing", "b", "c", "d"]);
    expect(facts.map((f) => [f.variantId, f.isPurchasable])).toEqual([
      ["e", true],
      ["a", true],
      ["b", false],
      ["c", false],
      ["d", false],
    ]);
    expect(facts[0]?.hero).toBeNull();
    expect(facts[1]).toMatchObject({
      productId: "prod-a",
      productName: "Prod a",
      variantName: "Variant a",
      priceCents: 1500,
      availability: "LOW_STOCK",
      hero: { mediaRef: "ref-a" },
    });
    expect(stub.calls).toBe(1);
  });

  it("is not purchasable when availability fails", async () => {
    const failing: ReadOnlyStockAvailabilityProvider = {
      getAvailability: () => Promise.reject(new Error("down")),
    };
    const { service } = setup(
      { getVariantsByIds: vi.fn().mockResolvedValue([row("a")]) },
      {},
      failing,
    );
    const [fact] = await service.getVariantsForCart(["a"]);
    expect(fact).toMatchObject({ availability: "OUT_OF_STOCK", isPurchasable: false });
  });

  it("skips data and availability for an empty list", async () => {
    const getVariantsByIds = vi.fn();
    const { service, stub } = setup({ getVariantsByIds });
    expect(await service.getVariantsForCart([])).toEqual([]);
    expect(getVariantsByIds).not.toHaveBeenCalled();
    expect(stub.calls).toBe(0);
  });
});

describe("fresh availability reads", () => {
  it("getProductsAvailability returns the best variant availability in one batch call", async () => {
    const getStockKeysByProductIds = vi.fn().mockResolvedValue([
      { productId: "p1", stockKeys: ["k:1a", "k:1b"] },
      { productId: "p2", stockKeys: ["k:2a"] },
    ]);
    const { service, stub } = setup(
      { getStockKeysByProductIds },
      { "k:1a": "OUT_OF_STOCK", "k:1b": "LOW_STOCK", "k:2a": "IN_STOCK" },
    );
    const result = await service.getProductsAvailability(["p1", "p2", "p3", "p1"]);
    expect(getStockKeysByProductIds).toHaveBeenCalledWith(["p1", "p2", "p3"]);
    expect(result.degraded).toBe(false);
    expect([...result.byProductId]).toEqual([
      ["p1", "LOW_STOCK"],
      ["p2", "IN_STOCK"],
      ["p3", "OUT_OF_STOCK"],
    ]);
    expect(stub.calls).toBe(1);
  });

  it("getProductsAvailability fails closed and flags degradation when the provider throws", async () => {
    const failing: ReadOnlyStockAvailabilityProvider = {
      getAvailability: () => Promise.reject(new Error("down")),
    };
    const { service } = setup(
      {
        getStockKeysByProductIds: vi
          .fn()
          .mockResolvedValue([{ productId: "p1", stockKeys: ["k:1a"] }]),
      },
      {},
      failing,
    );
    const result = await service.getProductsAvailability(["p1"]);
    expect(result.degraded).toBe(true);
    expect(result.byProductId.get("p1")).toBe("OUT_OF_STOCK");
  });

  it("getVariantsAvailability returns availability and purchasability per variant", async () => {
    const getVariantsByIds = vi.fn().mockResolvedValue([
      {
        ...variant("a", 1000),
        productId: "p",
        productName: "P",
        productSlug: "p",
        productStatus: "ACTIVE",
        heroImage: null,
      },
      {
        ...variant("b", 1000),
        productId: "p",
        productName: "P",
        productSlug: "p",
        productStatus: "ACTIVE",
        heroImage: null,
      },
    ]);
    const { service } = setup({ getVariantsByIds }, { "k:a": "IN_STOCK" });
    const result = await service.getVariantsAvailability(["a", "b"]);
    expect(result.byVariantId.get("a")).toEqual({ availability: "IN_STOCK", isPurchasable: true });
    expect(result.byVariantId.get("b")).toEqual({
      availability: "OUT_OF_STOCK",
      isPurchasable: false,
    });
  });
});
