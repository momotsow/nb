# Spec 3 Design: Shopping Cart

## 1. Persistence (additive migration `cart_init`)

```prisma
model Cart {
  id           String     @id @default(cuid())
  tokenHash    String     @unique        // SHA-256 of the opaque cookie token
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  expiresAt    DateTime                  // now + 30 days, slid on mutation
  items        CartItem[]

  @@index([expiresAt])
}

model CartItem {
  id                String         @id @default(cuid())
  cartId            String
  cart              Cart           @relation(fields: [cartId], references: [id], onDelete: Cascade)
  variantId         String
  variant           ProductVariant @relation(fields: [variantId], references: [id])
  quantity          Int            // 1..99, also enforced by CHECK
  lastSeenPriceCents Int           // change detection only; never displayed
  createdAt         DateTime       @default(now())

  @@unique([cartId, variantId])
}

model RateLimitBucket {
  key         String
  windowStart DateTime
  count       Int
  @@id([key, windowStart])
}
```

- No `userId`, `discountCode`, `giftMessage` (all out of scope). The draft schema's versions are dropped.
- Raw SQL in the migration: `CHECK (quantity BETWEEN 1 AND 99)`.
- Only the token hash is stored, so a database leak does not yield usable cart cookies.
- `db:verify` allowed-table set gains `Cart`, `CartItem`, `RateLimitBucket`. Forbidden list is unchanged.

## 2. Layers

```
src/domain/cart/              pure rules
src/data/cart/                Prisma access, atomic upsert, purge
src/integrations/ratelimit/   RateLimiter interface; Postgres adapter in src/data/ratelimit
src/integrations/cart-token/  token create/hash (Node crypto)
src/application/cart/         CartService, read model (Zod), error types
src/ui/cart/                  CartLine, QuantityControl, CartSummary, CartBadge, AddToCartButton
src/app/(store)/cart/         page + server actions
```

## 3. Domain (pure)

```ts
const MAX_QTY = 99;
parseQuantity(n: unknown): Result<number, "NOT_INTEGER" | "TOO_LOW" | "TOO_HIGH">
addQuantity(existing: number, add: number): { quantity: number; clamped: boolean }
lineSubtotal(unit: Cents, qty: number): Cents
cartSubtotal(lines: {unit: Cents; qty: number}[]): Cents
detectPriceChange(lastSeen: Cents, current: Cents): boolean
```
`addQuantity` returns `min(existing+add, 99)` and `clamped=true` if the cap applied. `parseQuantity` is used for update (add allows 1..99 too). Zero is `TOO_LOW`.

## 4. Token and cookie

- Token: 32 random bytes from `crypto.randomBytes`, base64url. Cookie value is the token; DB stores `sha256(token)`.
- Cookie `nb_cart`: `httpOnly`, `secure` (except local http dev), `sameSite: "lax"`, `path: "/"`, `maxAge: 2592000`.
- Cookies can only be set in Server Functions or Route Handlers (Next docs: `cookies`). So:
  - **First add** creates the cart and sets the cookie inside the server action.
  - **Page render** only reads the cookie. No cookie, invalid format or expired cart renders the empty cart. Never creates a cart.
  - Every mutation re-sets the cookie (slides the browser lifetime) and extends `expiresAt`.
- Under `cacheComponents`, any read of `cookies()` sits in a `<Suspense>` boundary. The cart page's body, and the nav badge, are dynamic holes inside an otherwise static shell.
- Token format is validated by Zod (`/^[A-Za-z0-9_-]{43}$/`) before hashing, so malformed tokens never reach the database.

## 5. Application contract

```ts
interface CartService {
  getCart(token: string | null): Promise<CartView>
  addItem(token: string | null, input: {variantId: string; quantity: number}): Promise<AddResult>
  updateQuantity(token: string, input: {variantId: string; quantity: number}): Promise<MutationResult>
  removeItem(token: string, variantId: string): Promise<MutationResult>
  clear(token: string): Promise<MutationResult>
  getItemCount(token: string | null): Promise<number>
}
```

`AddResult` includes `newToken?: string` (only when a cart was created) so the action layer sets the cookie. The application layer never touches `cookies()`.

Typed errors: `INVALID_INPUT`, `VARIANT_NOT_FOUND`, `NOT_PURCHASABLE`, `CART_NOT_FOUND`, `LINE_NOT_FOUND`, `RATE_LIMITED`, `UNEXPECTED`. Each maps to a customer-safe message and never carries internals.

### getCart algorithm
1. Resolve cart by `tokenHash` where `expiresAt > now()`. None => empty `CartView`.
2. One query for items. One call `CatalogueService.getVariantsForCart(variantIds)` (Spec 2 contract, which batches availability). Bounded, no N+1.
3. For each line: `unit = current priceCents`, `lineSubtotal`, `availability`, `unavailable = !isPurchasable`, `priceUpdated = detectPriceChange(lastSeen, current)`. A variant missing from the catalogue (hard-deleted) is shown as an unavailable line with a generic name. It is never silently dropped.
4. Cart-level: `subtotalCents` over all lines that are purchasable. Unavailable lines are flagged and excluded from the subtotal so the customer never sees a payable figure that includes something they cannot buy (see D-11 for confirmation). `anyPriceUpdated`, `lineCount`, `itemCount`, currency `ZAR`.
5. Validate with the Zod `CartViewSchema`. Fail closed with `UNEXPECTED` if invalid.

### addItem algorithm
1. Zod-parse input. Rate-limit by token hash (or client IP bucket when no token, hashed).
2. `getVariantsForCart([variantId])`; reject `VARIANT_NOT_FOUND` / `NOT_PURCHASABLE`.
3. If no cart for the token, create one (new token).
4. Atomic upsert, a single SQL statement, safe under concurrency (E-4):
   ```sql
   INSERT INTO "CartItem"(id, "cartId", "variantId", quantity, "lastSeenPriceCents")
   VALUES ($1,$2,$3,$4,$5)
   ON CONFLICT ("cartId","variantId")
   DO UPDATE SET quantity = LEAST("CartItem".quantity + EXCLUDED.quantity, 99),
                 "lastSeenPriceCents" = EXCLUDED."lastSeenPriceCents"
   RETURNING quantity, (("CartItem".quantity + EXCLUDED.quantity) > 99) AS clamped;
   ```
   Executed with `$queryRaw` tagged template (parameterised). Cart row `expiresAt` is bumped in the same transaction.
5. Emit `add_to_cart`. Return `{ quantity, clamped, newToken? }`.

`updateQuantity` is an `UPDATE ... SET quantity=$n, lastSeenPriceCents=$current WHERE cartId AND variantId`, returning zero rows as `LINE_NOT_FOUND`. It re-baselines the price (C1). Removal is a separate `DELETE`.

## 6. Server actions and UI

- `src/app/(store)/cart/actions.ts` (`'use server'`): `addToCartAction`, `updateQuantityAction`, `removeItemAction`, `clearCartAction`. Each: parse `FormData` with Zod, read cookie, call service, set cookie if `newToken` or on any success (slide), `revalidatePath('/cart')`, return a typed `ActionState` for `useActionState`.
- Because actions are POST, Next provides origin checks for CSRF protection. No additional token is needed for same-site form posts.
- `AddToCartButton` replaces Spec 2's `AddToCartSlot` implementation (same props). It posts the variant id and quantity only. No price field exists in the form.
- `/cart` page: Suspense with a skeleton, then `CartView`. States: empty, error, loading, unavailable line (`Notice` plus Remove button), per-line "Price updated" plus cart-level summary notice, max-quantity notice. A `LiveRegion` announces add, update, remove and price/availability notices.
- `QuantityControl`: number input with explicit "Update" submit (works without JS), plus +/- buttons as progressive enhancement. Remove is its own button with an accessible name including the product and variant name.
- Optimistic UI is not used in v1. Server actions are fast and the server stays authoritative (P-3 allows but does not require it).
- `CartBadge` in the header reads `getItemCount` inside Suspense. Optional drawer is not built.
- Subtotal-only summary. No tax line. Placeholders for discounts and shipping are not rendered (the spec allows them, but D-12 recommends omitting to avoid implying a commitment).

## 7. Rate limiting

```ts
interface RateLimiter { check(key: string, limit: number, windowSec: number): Promise<{ allowed: boolean }> }
```
Postgres adapter: `INSERT ... ON CONFLICT (key, windowStart) DO UPDATE SET count = count + 1 RETURNING count`, with `windowStart` truncated to the window. Defaults: 30 mutations per minute per cart, 60 per minute per client IP hash. Old buckets are purged opportunistically. If the limiter itself errors, mutations fail closed with `RATE_LIMITED` unavailable message rather than skipping the protection.

## 8. Analytics (four events, registered in the Spec 1 allow-list)

| Event | Trigger | Payload |
|---|---|---|
| `add_to_cart` | successful add | `{ variantId, quantity, clamped }` |
| `cart_viewed` | `/cart` rendered with at least one line | `{ lineCount, hasUnavailable, anyPriceUpdated }` |
| `cart_quantity_updated` | successful update | `{ variantId, quantity }` |
| `remove_from_cart` | successful remove | `{ variantId }` |

No money, no token, no cart id. Test asserts the union is exactly five catalogue plus four cart.

## 9. SEO
`/cart` exports `metadata.robots = { index: false, follow: false }` and is added to the robots disallow list. Not in the sitemap.

## 10. Observability
Failures call `ErrorReporter.capture(err, { op: "cart.add", code })` with `SafeContext` only. Cart contents and tokens are never logged.

## 11. Testing design

| Req | Test |
|---|---|
| T-1 | Domain unit: quantity parsing, clamp, subtotal math, price change |
| T-2 | Application with stub catalogue and availability: current-price-at-read, unavailable flagged, price-updated flags, subtotal excludes unavailable |
| T-3 | DB integration: migration, token hash lookup, expiry, 30-day slide, concurrent adds (two parallel `addItem` calls total correctly and cap at 99), CHECK constraint |
| T-4 | Component and axe: all states |
| T-5 | Playwright: add → cart → update → remove, unavailable keep-and-flag, persistence across navigation |
| T-6 | Architecture test over new folders |
| T-7 | Security: tampered price, negative/huge/fractional quantity, forged variant id, malformed token, another cart's token guess |
| T-8 | Analytics allow-list set equality |

## 12. Risks
- Postgres-backed limiter adds a write per mutation. Acceptable at launch scale. Revisit if traffic warrants Redis.
- Sliding expiry only on mutation means a customer who only browses for 30 days loses the cart. Accepted and documented (C2).
