import { z } from "zod";

/**
 * Analytics allow-list. Each spec registers events here as
 * `name: z.strictObject({...})`. Schemas MUST be strict so extra keys
 * (possible PII) are rejected, and MUST NOT declare free-text fields such as
 * email, phone, name or address. Prefer enums, ids, counts and booleans.
 *
 * Catalogue (Spec 2) events: ids, slugs, counts only. The raw search query is
 * never carried; only its length and the result count (D-09).
 */
const id = z.string().min(1).max(100);
const slug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const count = z.number().int().nonnegative();

export const ALLOWED_EVENTS = {
  product_viewed: z.strictObject({ productId: id, productSlug: slug }),
  search_performed: z.strictObject({ queryLength: count, resultCount: count }),
  collection_viewed: z.strictObject({ collectionSlug: slug }),
  category_viewed: z.strictObject({ categorySlug: slug }),
  product_relationship_clicked: z.strictObject({ fromProductId: id, toProductId: id }),
} satisfies EventRegistry;

export type EventRegistry = Record<string, z.ZodObject>;

export type AnalyticsEventName = keyof typeof ALLOWED_EVENTS & string;
