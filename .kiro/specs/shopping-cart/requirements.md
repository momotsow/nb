# Spec 3 Requirements: Shopping Cart

**Status:** Requirements APPROVED by the owner (per handover pack). This file is a pointer plus implementation clarifications. It does not change any requirement.
**Depends on:** foundation-design-system (Spec 1), catalogue-product-experience (Spec 2).

## Authoritative source

#[[file:docs/Developer_Handover_Pack/06_Current_Specifications/Spec_3_Shopping_Cart_Requirements.md]]

The source file has broken markdown escaping (stray `\*\*`, `**#` headings) but the content is intact. Section numbers below refer to it. Do not edit the handover file. If the requirements need to change, record a decision and update with owner approval.

## Summary of binding rules

- Guest-only, server-authoritative cart. Opaque server-issued token in a secure, http-only, same-site cookie. 30-day retention and cookie lifetime (FR-1, FR-8, S-2).
- Add, update quantity (1..99, integer), remove, clear, view (FR-2, FR-3, FR-12). Re-adding increments and clamps to 99 with a non-blocking notice (FR-2, E-6). Quantity 0 is rejected.
- Display facts (name, price, availability, image) resolved from current catalogue at read time (ST-1..ST-3, FR-4). Money is integer ZAR cents, subtotal only, no tax (PM-1..PM-5, decision 10).
- Unavailable lines are kept and flagged (FR-7). Price change shows per-line and cart-level indicators using the current price (FR-13).
- Four analytics events only: `add_to_cart`, `cart_viewed`, `cart_quantity_updated`, `remove_from_cart` (AN-1..AN-4).
- `/cart` is non-indexable (SEO-1). Rate limiting on mutations (S-4). PII-scrubbed observability (O-1).
- No inventory operations, no checkout, no discounts, no auth, no merge, no AI (§7, IB-1..IB-4).

## Implementation clarifications (design-level interpretations, flagged for review)

These fill gaps the requirements deliberately left to Design. None changes scope.

- **C1 (FR-13 storage):** Detecting a price change needs the price the customer last saw. The cart stores `lastSeenPriceCents` per line, used only for change detection and never displayed or used for totals (D-06). This is the one denormalised field and is the minimum ST-3 allows.
- **C2 (FR-8 sliding retention):** The 30-day window slides on cart mutations. Pure reads do not extend it, because cookies cannot be set during page render. Spec 4 describes this as "30-day sliding retention".
- **C3 (S-4 limiter store):** Rate limiting uses a Postgres-backed fixed-window counter behind a `RateLimiter` interface, because in-memory counters do not work across serverless instances and the spec forbids unnecessary infrastructure (D-07).
- **C4 (expiry cleanup):** Expired carts are treated as absent on read and purged opportunistically during mutations. No scheduler (D-10).
- **C5 (E-6 notice on add):** "Max quantity reached" is returned as a typed result from the action and announced via the live region.

## Open questions

None for requirements. Clarifications C1-C5 need owner acknowledgement before tasks 1-3 start.
