# Spec 2 Tasks: Catalogue and Product Experience

Prerequisite: Spec 1 tasks 1-12 complete.

- [x] 1. Reconcile Prisma schema
  - Archive current schema to `docs/deferred/schema-v0.1-draft.prisma`.
  - Reduce `schema.prisma` to catalogue models; add `stockKey`; rename image fields to `mediaRef`; drop inventory, sale and non-catalogue relations.
  - Run `prisma generate`; fix compile errors from removed generated models.
  - _Requirements: R1.1, R1.2, R1.3_

- [x] 2. Migration `catalogue_init`
  - Generate migration, then append generated `tsvector` column and GIN index SQL.
  - Verify it deploys on an empty Postgres and on a re-run.
  - _Requirements: R1.6, R4.4_

- [x] 3. `db:verify` script
  - Allowed-table assertion plus forbidden-table list. Wire into `db-verification` CI.
  - _Requirements: R1.3_

- [x] 4. Domain catalogue rules
  - Visibility (`ACTIVE` ∧ active variant), `isPurchasable`, variant default selection, price helpers using Spec 1 Money.
  - Unit tests.
  - _Requirements: R1.4, R2.3_

- [x] 5. Availability boundary
  - Interface, `withFailClosed` wrapper, deterministic stub, production-start guard (no registered implementation in production fails loudly).
  - Tests: unknown key fails closed, provider error fails closed and is reported, batch call count.
  - _Requirements: R2.1, R2.2, R2.3, R2.4_

- [x] 6. Data layer
  - `src/data/catalogue`: list, detail, collection, category, variants-by-id, parameterised FTS query. Plain row types out.
  - Integration tests against Postgres.
  - _Requirements: R1.4, R4.4, R8.3, R9.1_

- [x] 7. Application service and read models
  - `CatalogueService` including `getVariantsForCart` (the contract Spec 3 and 4 consume). Zod schemas for every view.
  - Application tests with stubbed data and availability.
  - _Requirements: R3.1, R3.2, R3.3_

- [x] 8. Query parsing and rate limit hook
  - `parseListQuery`, slug validation, `q` length cap. Search rate limiter via the interface defined in Spec 3 design (placeholder in-memory implementation for dev only, flagged).
  - _Requirements: R9.1, R9.2_

- [x] 9. Seed data
  - `prisma/seed.ts` placeholder dataset, fixtures for stub availability, refuses in production.
  - _Requirements: R5.2_

- [x] 10. UI components with stories and tests
  - ProductCard, ProductGallery, VariantSelector, Filters, Pagination, AddToCartSlot, availability notice.
  - Component and axe tests, keyboard tests.
  - _Requirements: R4.5, R4.6, R8.1, R8.2, R8.4_

- [x] 11. Routes: shop, collection, category, product
  - Implement with `'use cache'` for catalogue reads and Suspense around availability. Loading, empty, error, not-found states.
  - Check the Next docs in `node_modules/next/dist/docs` for `use cache`, `cacheTag`, `cacheLife` before writing.
  - _Requirements: R4.1, R4.2, R4.3, R4.5_

- [x] 12. Search route
  - `/search` page with form, results, empty and no-results states, `noindex`.
  - _Requirements: R4.4, R6.3_

- [x] 13. SEO
  - `generateMetadata`, canonicals, JSON-LD (escaped), Open Graph, sitemap source, robots entry.
  - Snapshot tests.
  - _Requirements: R6.1, R6.2, R6.3, R4.7_

- [x] 14. Analytics events
  - Register the five events; `TrackOnMount` plus server action; relationship click beacon.
  - Allow-list tests including extra-key rejection and no raw search query.
  - _Requirements: R7.1, R7.2, R7.3_

- [x] 15. Brand copy checks
  - Run copy rules across seed and templates; adjust any hits.
  - _Requirements: R5.1_

- [x] 16. E2E and architecture tests
  - Playwright: browse → collection → product → search with stub availability; fail-closed banner path.
  - Extend architecture test to the new folders.
  - _Requirements: R3.3, section 5_

- [ ] 17. Definition of Done gate
  - Run all gates, record manual AT notes, update decision log (D-08 launch stance).
  - _Requirements: all_
