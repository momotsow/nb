// Read models returned by CatalogueService. Every view is validated with Zod before it leaves
// the application layer. Money is integer cents; images are MediaView (never raw refs/URLs).
import { z } from "zod";

export const availabilitySchema = z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]);

export const mediaViewSchema = z
  .object({
    mediaRef: z.string().min(1),
    alt: z.string(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  })
  .strict();

const centsSchema = z.number().int().nonnegative();

export const productSummarySchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    shortDesc: z.string(),
    featured: z.boolean(),
    priceFromCents: centsSchema,
    /** True when variants differ in price, so UI can show "From". */
    priceIsRange: z.boolean(),
    availability: availabilitySchema,
    hero: mediaViewSchema.nullable(),
  })
  .strict();

export const pagingSchema = z
  .object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    pageCount: z.number().int().nonnegative(),
  })
  .strict();

export const productListViewSchema = pagingSchema
  .extend({
    items: z.array(productSummarySchema),
    /** True when availability could not be read and every item was forced to OUT_OF_STOCK. */
    availabilityDegraded: z.boolean(),
  })
  .strict();

export const variantViewSchema = z
  .object({
    id: z.string().min(1),
    sku: z.string().min(1),
    name: z.string(),
    priceCents: centsSchema,
    availability: availabilitySchema,
    isPurchasable: z.boolean(),
  })
  .strict();

const nameSlugSchema = z.object({ name: z.string(), slug: z.string() }).strict();

export const productDetailSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1),
    shortDesc: z.string(),
    description: z.string(),
    story: z.string().nullable(),
    ingredients: z.string().nullable(),
    scentNotes: z.string().nullable(),
    directions: z.string().nullable(),
    safetyInfo: z.string().nullable(),
    warnings: z.string().nullable(),
    benefits: z.string().nullable(),
    seoTitle: z.string().nullable(),
    seoDescription: z.string().nullable(),
    updatedAt: z.string(),
    category: nameSlugSchema.nullable(),
    collections: z.array(nameSlugSchema),
    images: z.array(mediaViewSchema),
    attributes: z.array(z.object({ key: z.string(), value: z.string() }).strict()),
    variants: z.array(variantViewSchema).min(1),
    defaultVariantId: z.string().min(1),
    priceFromCents: centsSchema,
    priceIsRange: z.boolean(),
    availability: availabilitySchema,
    related: z.array(productSummarySchema),
    availabilityDegraded: z.boolean(),
  })
  .strict();

export const collectionViewSchema = z
  .object({
    collection: z
      .object({
        slug: z.string(),
        name: z.string(),
        tagline: z.string().nullable(),
        story: z.string().nullable(),
        hero: mediaViewSchema.nullable(),
      })
      .strict(),
    products: productListViewSchema,
  })
  .strict();

export const categoryViewSchema = z
  .object({
    category: nameSlugSchema,
    products: productListViewSchema,
  })
  .strict();

export const searchViewSchema = productListViewSchema.extend({ query: z.string() }).strict();

export const cartVariantFactsSchema = z
  .object({
    variantId: z.string().min(1),
    productId: z.string().min(1),
    productName: z.string(),
    variantName: z.string(),
    priceCents: centsSchema,
    availability: availabilitySchema,
    isPurchasable: z.boolean(),
    hero: mediaViewSchema.nullable(),
  })
  .strict();

export type MediaViewModel = z.infer<typeof mediaViewSchema>;
export type ProductSummary = z.infer<typeof productSummarySchema>;
export type ProductListView = z.infer<typeof productListViewSchema>;
export type VariantView = z.infer<typeof variantViewSchema>;
export type ProductDetailView = z.infer<typeof productDetailSchema>;
export type CollectionView = z.infer<typeof collectionViewSchema>;
export type CategoryView = z.infer<typeof categoryViewSchema>;
export type SearchView = z.infer<typeof searchViewSchema>;
export type CartVariantFacts = z.infer<typeof cartVariantFactsSchema>;
