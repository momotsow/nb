import type { MediaView, ProductSummary, VariantView } from "./types";

// Placeholder data for stories and tests only.
export const media = (n: number): MediaView => ({
  mediaRef: `/seed/image-${n}.svg`,
  alt: `Sample product view ${n}`,
  width: 800,
  height: 800,
});

export const images: MediaView[] = [media(1), media(2), media(3)];

export const variants: VariantView[] = [
  {
    id: "v1",
    sku: "SEED-A-S",
    name: "Small",
    priceCents: 12500,
    availability: "IN_STOCK",
    isPurchasable: true,
  },
  {
    id: "v2",
    sku: "SEED-A-M",
    name: "Medium",
    priceCents: 19500,
    availability: "LOW_STOCK",
    isPurchasable: true,
  },
  {
    id: "v3",
    sku: "SEED-A-L",
    name: "Large",
    priceCents: 27500,
    availability: "OUT_OF_STOCK",
    isPurchasable: false,
  },
];

export const product: ProductSummary = {
  id: "p1",
  slug: "seed-sample-candle",
  name: "Sample candle",
  shortDesc: "Placeholder copy for a sample product.",
  featured: false,
  priceFromCents: 12500,
  priceIsRange: true,
  availability: "IN_STOCK",
  hero: media(1),
};
