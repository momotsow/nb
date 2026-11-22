# Spec 1 Design: Foundation and Design System

## 1. Folder layout

```
src/
  app/                  routes, layouts, robots.ts, sitemap.ts (no business logic)
  ui/
    primitives/         Button, TextField, FormField, Notice, Price, ...
    states/             Skeleton, EmptyState, ErrorState
    shell/              Header, Footer, SkipLink, ThemeToggle
  application/          use-cases and read models (Zod-validated contracts)
  domain/               pure rules, no I/O, no framework
    money/
  data/                 Prisma access only; returns plain row shapes
  integrations/
    analytics/          AnalyticsProvider + adapters
    media/              MediaProvider + adapters
    auth/               AuthService (guest)
    observability/      error reporter + scrubber
  lib/                  env.ts, small shared helpers
```

`src/generated/prisma` is generated and git-ignored (already configured).

## 2. Boundary enforcement

- ESLint `no-restricted-imports` per folder:
  - `src/ui/**`, `src/app/**`: forbid `@prisma/client`, `src/generated/**`, `src/data/**`, `src/integrations/**/adapters/**`.
  - `src/domain/**`: forbid `next/*`, `react`, `@prisma/client`, `src/data`, `src/integrations`, `zod` is allowed only in `application` and `lib`.
  - `src/application/**`: may import domain, data interfaces, integration interfaces. No `react`.
- Architecture test (`src/architecture.test.ts`) walks imports with the TypeScript compiler API and asserts the same rules. Lint catches it early, the test catches config drift.

## 3. Environment

`src/lib/env.ts` keeps the lazy Zod parse. Changes:
- Remove `PAYMENT_PROVIDER: z.enum(["bobpay"])` default and the Bobpay keys. The payment provider is undecided (D-04). Re-add under the Payments spec.
- Split into `serverEnv()` and `publicEnv()` so only `NEXT_PUBLIC_*` can be imported from client code.
- `.env.example` is updated to match. `.env` stays git-ignored.

## 4. Money

```ts
// src/domain/money/money.ts
export type Cents = number & { readonly __brand: "ZarCents" };
export function cents(n: number): Cents          // throws unless Number.isSafeInteger(n) && n >= 0
export function add(a: Cents, b: Cents): Cents
export function mul(a: Cents, qty: number): Cents // qty must be a safe integer >= 0
export function formatZar(c: Cents): string       // Intl.NumberFormat("en-ZA", {style:"currency", currency:"ZAR"})
```

Pure and framework-free, so it lives in `domain`.

## 5. Design tokens and fonts

- Keep the existing token names in `globals.css` (`--nb-bg`, `--nb-surface`, `--nb-blush`, `--nb-accent`, `--nb-accent-strong`, `--nb-text`, `--nb-gold`). They are already mapped through `@theme inline`.
- Add semantic tokens used by primitives: `--nb-focus`, `--nb-danger`, `--nb-success`, `--nb-border`, `--nb-muted`. Both themes define them.
- Fonts: the scaffold loads `DM_Sans`, but the Brand Bible names Manrope. Design switches `layout.tsx` to `Manrope` via `next/font/google`, variable `--font-manrope`, and updates `--font-sans`. This is PROVISIONAL pending D-02.
- Theme: `data-theme` attribute set by an inline script in the layout head from a cookie, so there is no flash. The preference cookie is non-sensitive.
- Existing reduced-motion rule is kept, and primitives avoid JS-driven animation.

## 6. Primitives

All are server-compatible components unless they need state (`'use client'` only on `ThemeToggle`, `LiveRegion` announcer, and form controls needing client behaviour).

| Primitive | Notes |
|---|---|
| FormField | wraps a control; wires `htmlFor`, `aria-describedby` (hint, error), `aria-invalid` |
| Notice | `role="status"` (info) or `role="alert"` (error); icon plus text, never colour alone |
| LiveRegion | polite region with `announce(message)`; used by cart and checkout later |
| Price | takes `Cents`, renders formatted ZAR with `<data value>` |
| EmptyState / ErrorState / Skeleton | Spec 1 state primitives referenced by Specs 3 and 4 |

Touch targets are at least 44px. Focus ring uses `--nb-focus`.

## 7. Providers

```ts
// analytics
export type AnalyticsEvent = never; // extended by later specs via declaration of a const map
export const ALLOWED_EVENTS = {} as const;
export interface AnalyticsProvider { track<E extends AnalyticsEventName>(name: E, props: AnalyticsProps<E>): void }
```

Design pattern: each spec registers events in a single `src/integrations/analytics/events.ts` map of `name -> Zod schema`. `track` validates against that schema at runtime, drops and reports unknown or invalid events, and the type of `name` is derived from the map. Foundation ships the registry empty and the machinery tested with a test-only event. Payload schemas are `.strict()` so extra (possible PII) keys are rejected.

```ts
// auth
export type Actor = { kind: "guest" };
export interface AuthService { getActor(): Promise<Actor> }
```

```ts
// media
export interface MediaProvider { toView(ref: string, alt: string): MediaView }
export type MediaView = { mediaRef: string; alt: string; width: number; height: number }
```

The first adapter serves local files from `public/` through `next/image`. The Cloudinary adapter is deferred (vendor unconfirmed).

```ts
// observability
export interface ErrorReporter { capture(err: unknown, ctx?: SafeContext): void }
```
`SafeContext` is a typed bag of non-sensitive strings and numbers (step names, error codes). The scrubber removes headers, cookies, bodies, and email/phone patterns before any adapter sees the data.

## 8. Shell and metadata

- `layout.tsx` renders SkipLink, Header, `<main id="main">`, Footer.
- `robots.ts` builds its disallow list from a constant array that Specs 2-4 append to.
- `sitemap.ts` composes entries from registered sources; Foundation registers none.
- The placeholder `page.tsx` is trimmed so its links point only at routes that exist (R8.4).

## 9. Testing design

- Vitest for unit and architecture tests. React Testing Library plus `vitest-axe` for component a11y. Storybook with the a11y addon for visual and a11y review. Playwright with `@axe-core/playwright` for route-level checks and e2e.
- Package versions are pinned exactly when installed, consistent with the repo's existing pinned versions.

## 10. CI

```
secret-scan      gitleaks over the repo
quality-gates    install, format:check, lint, typecheck, test, build, storybook:build, npm audit
db-verification  postgres service, prisma migrate deploy, seed, db:verify, integration tests, test:e2e
```
`db:verify` asserts the expected tables exist and the forbidden inventory/order/payment tables do not.

## 11. Risks
- Fonts and hex values may change after design sign-off. Tokens are centralised so this is a one-file edit.
- `cacheComponents` makes any un-suspended `cookies()` read a build error. The theme script reads the cookie in an inline script rather than a server read to keep the shell static.
