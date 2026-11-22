# Spec 3 Tasks: Shopping Cart

Prerequisite: Spec 2 tasks 1-9 complete (schema, `CatalogueService.getVariantsForCart`, availability boundary).
Gate: owner acknowledges clarifications C1-C5 in `requirements.md`.

- [ ] 1. Cart domain rules
  - `parseQuantity`, `addQuantity`, `lineSubtotal`, `cartSubtotal`, `detectPriceChange` in `src/domain/cart`.
  - Unit tests per T-1.
  - _Requirements: FR-2, FR-3, BR-2, BR-3, BR-5, BR-7, PM-1, PM-2, T-1_

- [ ] 2. Schema and migration `cart_init`
  - Add `Cart`, `CartItem`, `RateLimitBucket`. Raw SQL `CHECK (quantity BETWEEN 1 AND 99)`.
  - Extend `db:verify` allowed tables; forbidden list unchanged.
  - _Requirements: M-1, M-2, M-3, ST-3, IB-1_

- [ ] 3. Token and cookie utilities
  - Token generator, SHA-256 hasher, Zod token-format schema, cookie option constants.
  - Tests: entropy length, format rejection, hash determinism.
  - _Requirements: FR-1, S-2, V-2_

- [ ] 4. Cart data layer
  - `src/data/cart`: find by token hash (non-expired), create, atomic add upsert (raw SQL above), update quantity, delete line, clear, extend expiry, opportunistic expired purge.
  - DB integration tests including concurrent adds and 99 cap.
  - _Requirements: FR-8, E-4, T-3_

- [ ] 5. Rate limiter
  - `RateLimiter` interface, Postgres adapter, bucket purge. Fail-closed behaviour.
  - Tests for window rollover and limit enforcement. Also wire it into Spec 2 search.
  - _Requirements: S-4_

- [ ] 6. Cart application service and read model
  - `CartService`, `CartViewSchema` (Zod), typed errors, `getCart` and `addItem` per Design §5.
  - Application tests with stubbed catalogue and availability per T-2 and T-7.
  - _Requirements: FR-4..FR-7, FR-10, FR-12, FR-13, ST-1, ST-2, V-1..V-3, P-2, T-2, T-7_

- [ ] 7. Analytics events
  - Register `add_to_cart`, `cart_viewed`, `cart_quantity_updated`, `remove_from_cart` with strict schemas. Emit from the service.
  - Allow-list test: exactly nine events.
  - _Requirements: AN-1..AN-4, T-8_

- [ ] 8. Server actions
  - `addToCartAction`, `updateQuantityAction`, `removeItemAction`, `clearCartAction` with `useActionState` result types, cookie set and slide, `revalidatePath`.
  - Read the Next docs on server functions and `cookies` before coding; confirm behaviour under `cacheComponents`.
  - _Requirements: FR-1, FR-12, S-1, S-3, C2, C5_

- [ ] 9. Cart UI components
  - CartLine, QuantityControl, CartSummary, empty and error states, unavailable and price-updated notices, live-region announcements. Stories, component and axe tests, keyboard tests.
  - _Requirements: FR-7, FR-11, FR-13, E-2, E-3, E-5, E-6, A-1..A-4, T-4_

- [ ] 10. `/cart` page and header badge
  - Dynamic body inside Suspense, `noindex`, robots disallow entry, `CartBadge` with `getItemCount`.
  - _Requirements: FR-9, FR-11, SEO-1, P-1_

- [ ] 11. Replace Spec 2 add-to-cart slot
  - `AddToCartButton` implementing the slot props; product page unchanged apart from the import. Announce result and max-quantity notice.
  - _Requirements: FR-2, A-2, E-6_

- [ ] 12. Observability
  - `ErrorReporter` calls on failures with safe context only. Test that no token or cart contents appear.
  - _Requirements: O-1, O-2_

- [ ] 13. E2E and architecture tests
  - Playwright journeys per T-5 using seeded data and stub availability. Cart persists across navigation and reload.
  - Extend architecture test to cart folders.
  - _Requirements: T-5, T-6, S-5_

- [ ] 14. Definition of Done gate
  - All gates green, manual AT pass noted, decision log updated, Spec 2 catalogue events unchanged.
  - _Requirements: §25 of the source requirements_
