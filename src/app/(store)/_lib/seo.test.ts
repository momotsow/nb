import { beforeAll, describe, expect, it, vi } from "vitest";
import type { CategoryView, CollectionView, ProductDetailView } from "@/application/catalogue";
import {
  categoryMetadata,
  collectionMetadata,
  productJsonLd,
  productMetadata,
  searchMetadata,
  shopMetadata,
} from "./seo";

beforeAll(() => {
  vi.stubEnv("APP_URL", "https://example.test");
});

const hero = { mediaRef: "/seed/alpha.svg", alt: "Alpha jar", width: 800, height: 800 };

const summary = {
  id: "p1",
  slug: "alpha",
  name: "Alpha",
  shortDesc: "s",
  featured: false,
  priceFromCents: 12950,
  priceIsRange: false,
  availability: "IN_STOCK" as const,
  hero,
};

const product: ProductDetailView = {
  id: "p1",
  slug: "alpha",
  name: "Alpha </script>",
  shortDesc: "A calming candle.",
  description: "Long description.",
  story: null,
  ingredients: null,
  scentNotes: null,
  directions: null,
  safetyInfo: null,
  warnings: null,
  benefits: null,
  seoTitle: null,
  seoDescription: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  category: { name: "Candles", slug: "candles" },
  collections: [],
  images: [hero],
  attributes: [],
  variants: [
    {
      id: "v1",
      sku: "SEED-A-1",
      name: "200g",
      priceCents: 12950,
      availability: "IN_STOCK",
      isPurchasable: true,
    },
    {
      id: "v2",
      sku: "SEED-A-2",
      name: "400g",
      priceCents: 20000,
      availability: "OUT_OF_STOCK",
      isPurchasable: false,
    },
  ],
  defaultVariantId: "v1",
  priceFromCents: 12950,
  priceIsRange: true,
  availability: "IN_STOCK",
  related: [],
  availabilityDegraded: false,
};

const list = {
  items: [summary],
  page: 1,
  pageSize: 24,
  total: 1,
  pageCount: 1,
  availabilityDegraded: false,
};

describe("catalogue metadata snapshots", () => {
  it("shop", () => {
    expect(shopMetadata(1)).toMatchSnapshot();
    expect(shopMetadata(2)).toMatchSnapshot();
  });

  it("collection", () => {
    const view: CollectionView = {
      collection: { slug: "calm", name: "Calm", tagline: "Slow down.", story: null, hero },
      products: list,
    };
    expect(collectionMetadata(view, 1)).toMatchSnapshot();
  });

  it("category", () => {
    const view: CategoryView = { category: { name: "Candles", slug: "candles" }, products: list };
    expect(categoryMetadata(view, 2)).toMatchSnapshot();
  });

  it("product prefers SEO fields and falls back to short description", () => {
    expect(productMetadata(product)).toMatchSnapshot();
    const custom = productMetadata({ ...product, seoTitle: "Custom", seoDescription: "Custom d" });
    expect(custom.title).toBe("Custom");
    expect(custom.description).toBe("Custom d");
  });

  it("search is noindex", () => {
    expect(searchMetadata()).toMatchSnapshot();
  });
});

describe("productJsonLd", () => {
  const ld = productJsonLd(
    product,
    new Map([
      ["v1", "LOW_STOCK"],
      ["v2", "OUT_OF_STOCK"],
    ]),
    "https://example.test",
  );

  it("matches the snapshot", () => {
    expect(ld).toMatchSnapshot();
  });

  it("uses ZAR catalogue prices and provider availability, with no review data", () => {
    expect(ld.offers.map((o) => [o.price, o.priceCurrency, o.availability])).toEqual([
      ["129.50", "ZAR", "https://schema.org/InStock"],
      ["200.00", "ZAR", "https://schema.org/OutOfStock"],
    ]);
    expect(JSON.stringify(ld)).not.toMatch(/aggregateRating|review/i);
  });

  it("fails closed when availability is unknown", () => {
    const closed = productJsonLd(product, new Map(), "https://example.test");
    expect(closed.offers.every((o) => o.availability.endsWith("OutOfStock"))).toBe(true);
  });
});
