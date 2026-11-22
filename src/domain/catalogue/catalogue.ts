// Catalogue rules. Pure domain module: no Prisma, framework or provider imports.
import { cents, type Cents } from "../money/money";

export type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface VariantFacts {
  readonly id: string;
  readonly priceCents: number;
  readonly active: boolean;
}

export interface ProductFacts<V extends VariantFacts = VariantFacts> {
  readonly status: ProductStatus;
  readonly variants: readonly V[];
}

export interface PriceRange {
  readonly min: Cents;
  readonly max: Cents;
  /** True when variants differ in price, so UI can show "From". */
  readonly isRange: boolean;
}

const KNOWN: ReadonlySet<string> = new Set(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]);

/** Fail closed: unknown, missing or malformed availability is OUT_OF_STOCK. */
export function normalizeAvailability(value: unknown): Availability {
  return typeof value === "string" && KNOWN.has(value) ? (value as Availability) : "OUT_OF_STOCK";
}

export function activeVariants<V extends VariantFacts>(variants: readonly V[]): V[] {
  return variants.filter((v) => v.active);
}

/** Visible = status ACTIVE and at least one active variant. */
export function isProductVisible(product: ProductFacts): boolean {
  return product.status === "ACTIVE" && product.variants.some((v) => v.active);
}

/** Purchasable = product ACTIVE, variant active, availability not OUT_OF_STOCK. */
export function isPurchasable(
  productStatus: ProductStatus,
  variant: Pick<VariantFacts, "active">,
  availability: unknown,
): boolean {
  return (
    productStatus === "ACTIVE" &&
    variant.active &&
    normalizeAvailability(availability) !== "OUT_OF_STOCK"
  );
}

const RANK: Record<Availability, number> = { IN_STOCK: 2, LOW_STOCK: 1, OUT_OF_STOCK: 0 };

/** Best availability across variants; empty input is OUT_OF_STOCK. */
export function bestAvailability(values: readonly unknown[]): Availability {
  let best: Availability = "OUT_OF_STOCK";
  for (const v of values) {
    const a = normalizeAvailability(v);
    if (RANK[a] > RANK[best]) best = a;
  }
  return best;
}

/**
 * Deterministic default variant: among active variants, purchasable ones first,
 * then lowest price, then id. Returns null when no active variant exists.
 */
export function selectDefaultVariant<V extends VariantFacts>(
  productStatus: ProductStatus,
  variants: readonly V[],
  availability: ReadonlyMap<string, Availability> = new Map(),
): V | null {
  const candidates = activeVariants(variants);
  if (candidates.length === 0) return null;
  const sorted = [...candidates].sort((a, b) => {
    const pa = isPurchasable(productStatus, a, availability.get(a.id)) ? 0 : 1;
    const pb = isPurchasable(productStatus, b, availability.get(b.id)) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    if (a.priceCents !== b.priceCents) return a.priceCents - b.priceCents;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return sorted[0] ?? null;
}

/** Price range over active variants; null when none are active. */
export function priceRange(variants: readonly VariantFacts[]): PriceRange | null {
  const active = activeVariants(variants);
  if (active.length === 0) return null;
  const prices = active.map((v) => cents(v.priceCents));
  const min = prices.reduce((a, b) => (b < a ? b : a));
  const max = prices.reduce((a, b) => (b > a ? b : a));
  return { min, max, isRange: min !== max };
}

/** "From" price: lowest active variant price, or null. */
export function fromPrice(variants: readonly VariantFacts[]): Cents | null {
  return priceRange(variants)?.min ?? null;
}
