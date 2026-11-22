# Spec 2 Requirements: Catalogue and Product Experience

**Status:** DRAFT for review. Reconstructed from the Developer Handover Pack because no Spec 2 document was supplied (D-01).
**Depends on:** foundation-design-system (Spec 1).
**Consumed by:** Spec 3 (cart), Spec 4 (checkout), later Gift Finder.
**Sources:** Master Brief §4-6, 13; Product and Launch Bible (data model guidance); Brand Bible; Spec 3 and Spec 4 references to Spec 2 contracts.

## 1. Purpose

Provide the single source of truth for products, variants, prices and availability, and the public browse, search and product pages built on it. The catalogue is read-only to customers. Admin editing is out of scope.

## 2. In scope

- Catalogue persistence: Category, Collection, Product, ProductVariant, ProductImage, ProductAttribute, RelatedProduct.
- Read-only availability boundary (`ReadOnlyStockAvailabilityProvider`) keyed by `ProductVariant.stockKey`.
- Public routes: Shop All, category, collection, product detail, search.
- Structured, validated catalogue read models.
- Five analytics events.
- SEO: metadata, canonical URLs, JSON-LD Product, sitemap entries, Open Graph.
- Seed data that is clearly placeholder.
- Initial migration `catalogue_init`.

## 3. Out of scope

Admin CRUD, price history, sale pricing, discount logic, inventory ownership (stock counts, reservations, movements, warehouses), cart, checkout, reviews, wishlist, Gift Finder, AI search, Journal, memberships, and any invented product facts.

## 4. Requirements

### 4.1 Data
- **R1.1 (MUST):** `Product` has: name, slug (unique), short and long description, optional story, category, status (`DRAFT|ACTIVE|ARCHIVED`), featured flag, structured fact fields (ingredients, scent notes, directions, safety info, warnings, approved benefits), SEO title and description, timestamps.
- **R1.2 (MUST):** `ProductVariant` has: product, SKU (unique), name, `priceCents` (integer ZAR), `stockKey` (unique, opaque external reference), optional weight and dimensions, `active`.
- **R1.3 (MUST):** The schema contains no stock counts, reservations, movements, orders, payments, carts, users or discounts. `db:verify` fails if such tables exist.
- **R1.4 (MUST):** Only `ACTIVE` products with at least one `active` variant are customer-visible. Draft and archived products return not-found.
- **R1.5 (MUST):** Facts that are unapproved (ingredients, benefits, warnings) are nullable, and the UI renders only what is present. Nothing is auto-filled.
- **R1.6 (MUST):** Schema changes ship as an additive Prisma migration named `catalogue_init`.

### 4.2 Availability boundary
- **R2.1 (MUST):** `ReadOnlyStockAvailabilityProvider.getAvailability(stockKeys: string[]): Promise<Map<string, Availability>>` where `Availability` is `IN_STOCK | LOW_STOCK | OUT_OF_STOCK`. It is batch-capable (no N+1).
- **R2.2 (MUST):** The provider is read-only. Spec 2 introduces no write path.
- **R2.3 (MUST):** Unknown `stockKey` resolves to `OUT_OF_STOCK` (fail closed).
- **R2.4 (MUST):** A deterministic stub provider exists for tests and seeded e2e. The production-backed implementation is owned by a later Inventory spec (D-08).

### 4.3 Read models and contracts
- **R3.1 (MUST):** Application read models (`ProductSummary`, `ProductDetail`, `CollectionView`, `SearchResult`) are Zod-validated before leaving the application layer.
- **R3.2 (MUST):** Money is integer cents in read models. Images are `MediaView` via `MediaProvider`.
- **R3.3 (MUST):** UI never imports Prisma or provider SDKs.

### 4.4 Public pages
- **R4.1 (MUST):** `/shop` lists active products with pagination (page size 24), category and collection filters, and sort (featured, price asc/desc, newest).
- **R4.2 (MUST):** `/collections/[slug]` shows a published collection with its products. Unpublished returns not-found.
- **R4.3 (MUST):** `/products/[slug]` shows name, price, variant selector, hero and gallery, availability, scent story, verified contents/ingredients, who it suits, care and safety info (only fields present), and related products.
- **R4.4 (MUST):** `/search?q=` returns active products using Postgres full text search. Empty query and no-results states are handled.
- **R4.5 (MUST):** Every page has loading, empty, error and not-found states using Spec 1 primitives.
- **R4.6 (MUST):** Product page includes an add-to-cart slot component that is inert (disabled with explanation) until Spec 3 supplies behaviour. Spec 2 does not implement cart logic.
- **R4.7 (SHOULD):** Sharing links work well on WhatsApp (Open Graph image, title, description).

### 4.5 Brand and content
- **R5.1 (MUST):** Customer copy follows the Brand Bible voice, avoids the word "ritual", and makes no medical or therapeutic claims. The Spec 1 copy tests run over catalogue seed and templates.
- **R5.2 (MUST):** Seed data is flagged placeholder (SKU prefix `SEED-`, a `placeholder` attribute) and never uses the provisional launch boxes or planning prices as production data (D-05).

### 4.6 SEO
- **R6.1 (MUST):** Server-rendered indexable pages with unique title and description, canonical URL, Open Graph and Twitter card.
- **R6.2 (MUST):** JSON-LD `Product` and `Offer` on product pages, with price from the catalogue (ZAR) and availability from the provider. No review or rating data.
- **R6.3 (MUST):** `/search` is `noindex` and disallowed in `robots`. Product, collection and category URLs are in the sitemap.

### 4.7 Analytics
- **R7.1 (MUST):** Exactly five events, registered in the Spec 1 allow-list: `product_viewed`, `search_performed`, `collection_viewed`, `category_viewed`, `product_relationship_clicked`.
- **R7.2 (MUST):** Payloads contain ids, slugs, counts and enum values only. `search_performed` carries query length and result count, not the raw query (D-09).
- **R7.3 (MUST):** Events are emitted from application or client-intent handlers only through `AnalyticsProvider`.

### 4.8 Accessibility and performance
- **R8.1 (MUST):** Gallery, variant selector, filters and pagination are keyboard operable with accessible names and announced state changes.
- **R8.2 (MUST):** Images have meaningful alt text from the catalogue. Product images use responsive sizes, lazy loading below the fold, and reserved dimensions (no layout shift).
- **R8.3 (SHOULD):** Listing queries are bounded: one query for products plus one batch availability call.
- **R8.4 (MUST):** Reduced motion honoured.

### 4.9 Security
- **R9.1 (MUST):** Query and path inputs are Zod-validated (slug format, page, sort, `q` length cap of 100). Parameterised queries only.
- **R9.2 (MUST):** Search is rate-limited at the boundary (shared limiter from Spec 3 design, D-07, or an equivalent placeholder behind an interface).

## 5. Testing requirements
- Domain: variant selection and price rules.
- Application: read models with stubbed availability (visibility, fail-closed, pagination, sort).
- Integration (DB): migration deploys, seed loads, full text search, status filtering, `db:verify` forbidden-table check.
- Component and axe: gallery, variant selector, filters, states.
- E2E: browse → collection → product → search, seeded and deterministic.
- Analytics: allow-list accepts the five events and rejects others and extra keys.
- SEO: metadata and JSON-LD snapshot tests; `search` is noindex.
- Architecture: no Prisma or provider imports in UI.

## 6. Open questions
- **Q1:** Who sets availability before an Inventory spec exists, and what is the launch stance (D-08)? Production cannot go live on the stub.
- **Q2:** Is a sale price needed at launch? Draft schema had `saleCents`. Excluded here (D-05).
- **Q3:** Real product data, formulas, claims and photography (owner approval per Product Bible checklist).
- **Q4:** Media vendor (Cloudinary proposed, unconfirmed).

## 7. Definition of Done
All MUSTs tested, both CI jobs green, migration applies cleanly on empty Postgres, no inventory tables, axe clean, manual AT pass noted, SEO checks pass, decision log updated.
