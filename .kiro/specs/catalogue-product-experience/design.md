# Spec 2 Design: Catalogue and Product Experience

## 1. Schema reconciliation

The existing `prisma/schema.prisma` is a v0.1 draft covering the whole business. It conflicts with the specs, so Spec 2 reduces it to catalogue-only models.

Actions:
1. Copy the current file to `docs/deferred/schema-v0.1-draft.prisma` for reference (no information lost).
2. Reduce `schema.prisma` to: `Category`, `Collection`, `ProductCollection`, `Product`, `ProductVariant`, `ProductImage`, `ProductAttribute`, `RelatedProduct`, `ProductStatus`.
3. Changes versus the draft:
   - `ProductVariant`: remove `stockOnHand`, `lowStockAt`, `reservations`, `movements`, `cartItems`, `orderItems`, `saleCents`. Add `stockKey String @unique`.
   - `Product`: remove `wishlist`, `priceHistory` relations. Keep `searchVector`.
   - `Collection.heroImage` and `ProductImage.url` become `mediaRef` (opaque reference resolved by `MediaProvider`).
4. All `User`, `Order`, `Payment`, `Cart`, `Discount`, gifting, membership and content models leave the schema now and return in their own specs.

Search: add a generated `tsvector` column and GIN index through raw SQL in the migration (Prisma cannot declare generated columns):

```sql
ALTER TABLE "Product" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("name",'')), 'A') ||
    setweight(to_tsvector('english', coalesce("shortDesc",'')), 'B') ||
    setweight(to_tsvector('english', coalesce("scentNotes",'')), 'C')
  ) STORED;
CREATE INDEX "Product_searchVector_idx" ON "Product" USING GIN ("searchVector");
```
The Prisma field stays `Unsupported("tsvector")?` and is only queried through `$queryRaw` with parameters in `src/data/catalogue`.

Migration is created with `prisma migrate dev --name catalogue_init`. The Spec 3 text refers to an applied `20260918124342_catalogue_init`, but no migrations exist in this repo, so Prisma generates its own timestamp (D-01).

## 2. Layers

```
src/domain/catalogue/        visibility rules, variant selection, price helpers (pure)
src/data/catalogue/          Prisma queries -> plain row types
src/integrations/availability/
   provider.ts               ReadOnlyStockAvailabilityProvider interface
   stub.ts                   deterministic provider for tests/e2e/dev
   config.ts                 dev/launch-stance provider (see §4)
src/application/catalogue/   CatalogueService + read models (Zod)
src/ui/catalogue/            ProductCard, ProductGallery, VariantSelector, Filters, Pagination
src/app/(store)/...          routes
```

## 3. Application contracts

```ts
interface CatalogueService {
  listProducts(q: ListQuery): Promise<ProductListView>        // paged, filtered, sorted
  getProduct(slug: string): Promise<ProductDetailView | null> // null => notFound()
  getCollection(slug: string, q: ListQuery): Promise<CollectionView | null>
  getCategory(slug: string, q: ListQuery): Promise<CategoryView | null>
  search(q: string, page: number): Promise<SearchView>
  getVariantsForCart(ids: string[]): Promise<CartVariantFacts[]>   // consumed by Spec 3
}
```

`CartVariantFacts` is the single trusted read path Spec 3 and Spec 4 use: `{ variantId, productId, productName, variantName, priceCents, availability, isPurchasable, hero: MediaView | null }`. `isPurchasable` = product `ACTIVE` ∧ variant `active` ∧ availability ≠ `OUT_OF_STOCK`. Defining it here prevents Spec 3 from re-implementing visibility rules.

Each list call does: one Prisma query (with `include` of variants and hero image), then one batch `getAvailability` for all `stockKey`s. A product's displayed availability is the best of its variants. Zod schemas validate every returned view.

## 4. Availability provider

```ts
type Availability = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
interface ReadOnlyStockAvailabilityProvider {
  getAvailability(stockKeys: readonly string[]): Promise<ReadonlyMap<string, Availability>>;
}
```

- Missing key => `OUT_OF_STOCK` is applied by the caller wrapper `withFailClosed(provider)`.
- Provider errors: the wrapper catches, reports via `ErrorReporter`, and returns `OUT_OF_STOCK` for all keys. Pages render a banner (“availability temporarily unavailable”) and add-to-cart stays disabled. Never claim stock on failure.
- `stub.ts` takes a fixture map. E2E and tests use it.
- No production implementation ships in this spec (D-08). Until an Inventory spec exists, runtime selects the stub only when `APP_ENV` is not `production`. In production, the app refuses to start with a clear error unless an implementation is registered. This stops accidental launch on fake stock.

## 5. Routes

```
/shop                       app/(store)/shop/page.tsx
/collections/[slug]
/categories/[slug]
/products/[slug]
/search                     noindex
```

- Route params and `searchParams` are Zod-parsed in a `parseListQuery` helper; invalid values fall back to defaults, invalid slugs call `notFound()`.
- Under `cacheComponents`, catalogue reads use `'use cache'` with `cacheTag('catalogue')` and `cacheLife` of minutes. Availability is NOT cached with the product and is read inside a `<Suspense>` boundary so it is always fresh. The search page reads `searchParams` inside Suspense.
- `generateMetadata` per route; `generateStaticParams` is not used until real data volume warrants it.
- Add-to-cart slot: `<AddToCartSlot variantId disabledReason />` renders a disabled button with explanation. Spec 3 replaces its implementation without changing the product page.

## 6. UI composition
- `VariantSelector`: radio group (`fieldset`/`legend`), selected variant drives price and availability display via a small client component with the variant data passed as props. No price comes from the client back to anywhere.
- `ProductGallery`: first image eager (LCP), rest lazy; thumbnails are buttons with `aria-current`.
- `Filters`: plain `<form method="get">` so it works without JS. `Pagination`: links with `rel`, `aria-current`.
- Availability messages use text plus icon, announced via `LiveRegion` when the selected variant changes.

## 7. SEO
- Canonical built from `APP_URL` (`serverEnv`) plus the path, with filters and pagination stripped from canonicals except `page`.
- JSON-LD generated from the `ProductDetailView`, serialised with `JSON.stringify` and `<` escaped to `\u003c` to prevent script injection.
- `sitemap.ts` registers a catalogue source that lists active product, published collection and category URLs.
- `robots.ts` adds `/search`.

## 8. Analytics
Events registered in `src/integrations/analytics/events.ts`:

| Event | Trigger | Payload (`.strict()`) |
|---|---|---|
| `product_viewed` | product page rendered, once per view | `{ productId, productSlug }` |
| `search_performed` | search request with non-empty valid query | `{ queryLength, resultCount }` |
| `collection_viewed` | collection page rendered | `{ collectionSlug }` |
| `category_viewed` | category page rendered | `{ categorySlug }` |
| `product_relationship_clicked` | click on a related product link | `{ fromProductId, toProductId }` |

Page-view events fire from a tiny client component (`<TrackOnMount event=... />`) that calls a server action, so emission still goes through the server-side provider. The relationship click is a link with a server-action beacon; navigation never waits on analytics.

## 9. Seed
`prisma/seed.ts` loads 2 categories, 1 collection, 4 products and ~6 variants, all prefixed `SEED-`, with neutral copy, and `stockKey = "seed:<sku>"`. A fixture map for the stub provider covers in-stock, low stock and out-of-stock cases. Images reference files under `public/seed/`. Prices are obviously fictional and the seed refuses to run when `APP_ENV=production`.

## 10. `db:verify`
`scripts/db-verify.ts` queries `information_schema.tables` and asserts the exact allowed table set for the current spec stage, failing on unexpected or forbidden names (`StockMovement`, `StockReservation`, `Order*`, `Payment*`, etc.). Later specs extend the allowed set in the same file.

## 11. Risks
- Full text search config (`english`) suits product copy but not SA-specific words; acceptable for launch, revisit with data.
- Product detail pages depend on approved copy and photography. UI must degrade gracefully when optional facts are absent.
