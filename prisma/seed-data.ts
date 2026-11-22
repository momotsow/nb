// Placeholder catalogue dataset (R5.2). Pure data, no I/O, so tests can import it freely.
// Everything here is fictional: SKUs are prefixed SEED-, every product carries a
// `placeholder` attribute, and prices are deliberately unrealistic. Never copy the
// provisional launch boxes or planning prices into this file (D-05).
import type { Availability } from "../src/integrations/availability/provider";

export const SEED_SKU_PREFIX = "SEED-";

export type SeedCategory = { id: string; name: string; slug: string };
export type SeedCollection = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  story: string;
  mediaRef: string;
  sortOrder: number;
  published: boolean;
};
export type SeedVariant = {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stockKey: string;
  weightGrams: number;
};
export type SeedProduct = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string;
  description: string;
  story: string;
  categoryId: string;
  featured: boolean;
  scentNotes: string;
  seoTitle: string;
  seoDescription: string;
  images: { id: string; mediaRef: string; alt: string; sortOrder: number }[];
  attributes: { id: string; key: string; value: string }[];
  variants: SeedVariant[];
  collectionSortOrder: number;
};

export const seedCategories: readonly SeedCategory[] = [
  { id: "seed_cat_home", name: "Placeholder Home", slug: "seed-home" },
  { id: "seed_cat_body", name: "Placeholder Body", slug: "seed-body" },
];

export const seedCollection: SeedCollection = {
  id: "seed_col_sample",
  name: "Sample Collection",
  slug: "seed-sample-collection",
  tagline: "Placeholder collection for development",
  story: "This collection exists only to exercise the catalogue pages. It is not a real range.",
  mediaRef: "seed/collection-sample.svg",
  sortOrder: 0,
  published: true,
};

function variant(
  productKey: string,
  index: number,
  name: string,
  priceCents: number,
  weightGrams: number,
): SeedVariant {
  const sku = `${SEED_SKU_PREFIX}${productKey.toUpperCase()}-${index}`;
  return {
    id: `seed_var_${productKey}_${index}`,
    sku,
    name,
    priceCents,
    stockKey: `seed:${sku}`,
    weightGrams,
  };
}

function product(
  key: string,
  base: Omit<
    SeedProduct,
    "id" | "images" | "attributes" | "story" | "seoTitle" | "seoDescription" | "scentNotes"
  > & { scent: string },
): SeedProduct {
  const { scent, ...rest } = base;
  return {
    ...rest,
    id: `seed_prod_${key}`,
    story: "Placeholder story text used while the real content is being written.",
    scentNotes: scent,
    seoTitle: `${base.name} (placeholder)`,
    seoDescription: `Placeholder listing for ${base.name}. Not a real product.`,
    images: [
      {
        id: `seed_img_${key}_1`,
        mediaRef: `seed/${key}.svg`,
        alt: `Placeholder image for ${base.name}`,
        sortOrder: 0,
      },
    ],
    attributes: [
      { id: `seed_attr_${key}_placeholder`, key: "placeholder", value: "true" },
      { id: `seed_attr_${key}_scent`, key: "scent", value: scent },
    ],
  };
}

export const seedProducts: readonly SeedProduct[] = [
  product("alpha", {
    name: "Sample Candle",
    slug: "seed-sample-candle",
    shortDesc: "A placeholder candle for development.",
    description: "Placeholder description for a sample candle. Replace before launch.",
    categoryId: "seed_cat_home",
    featured: true,
    scent: "Sample Cedar",
    collectionSortOrder: 0,
    variants: [variant("alpha", 1, "Small", 11111, 150), variant("alpha", 2, "Large", 22222, 300)],
  }),
  product("bravo", {
    name: "Sample Diffuser",
    slug: "seed-sample-diffuser",
    shortDesc: "A placeholder diffuser for development.",
    description: "Placeholder description for a sample diffuser. Replace before launch.",
    categoryId: "seed_cat_home",
    featured: false,
    scent: "Sample Citrus",
    collectionSortOrder: 1,
    variants: [variant("bravo", 1, "100ml", 33333, 250)],
  }),
  product("charlie", {
    name: "Sample Soap",
    slug: "seed-sample-soap",
    shortDesc: "A placeholder soap bar for development.",
    description: "Placeholder description for a sample soap bar. Replace before launch.",
    categoryId: "seed_cat_body",
    featured: true,
    scent: "Sample Lavender",
    collectionSortOrder: 2,
    variants: [
      variant("charlie", 1, "Single bar", 4444, 100),
      variant("charlie", 2, "Pack of three", 12345, 300),
    ],
  }),
  product("delta", {
    name: "Sample Body Butter",
    slug: "seed-sample-body-butter",
    shortDesc: "A placeholder body butter for development.",
    description: "Placeholder description for a sample body butter. Replace before launch.",
    categoryId: "seed_cat_body",
    featured: false,
    scent: "Sample Vanilla",
    collectionSortOrder: 3,
    variants: [variant("delta", 1, "200g", 55555, 200)],
  }),
];

export const seedRelated: readonly { fromId: string; toId: string }[] = [
  { fromId: "seed_prod_alpha", toId: "seed_prod_bravo" },
  { fromId: "seed_prod_charlie", toId: "seed_prod_delta" },
];

export const seedVariants: readonly SeedVariant[] = seedProducts.flatMap((p) => p.variants);

/**
 * Fixtures for the deterministic stub availability provider (R2.4), keyed by stockKey.
 * Covers in-stock, low stock and out-of-stock.
 */
export const seedAvailabilityFixtures: Readonly<Record<string, Availability>> = {
  "seed:SEED-ALPHA-1": "IN_STOCK",
  "seed:SEED-ALPHA-2": "LOW_STOCK",
  "seed:SEED-BRAVO-1": "OUT_OF_STOCK",
  "seed:SEED-CHARLIE-1": "IN_STOCK",
  "seed:SEED-CHARLIE-2": "IN_STOCK",
  "seed:SEED-DELTA-1": "LOW_STOCK",
};
