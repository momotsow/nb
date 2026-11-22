# Spec 1 Requirements: Foundation and Design System

**Status:** DRAFT for review. Reconstructed from the Developer Handover Pack because no Spec 1 document was supplied (see `docs/decision-log.md` D-01).
**Depends on:** nothing.
**Consumed by:** Spec 2 (catalogue), Spec 3 (cart), Spec 4 (checkout).
**Sources:** Master Developer Brief §10-13, Technical Architecture prompt, Brand Bible, and the Spec 3 and Spec 4 references to a Spec 1 baseline.

## 1. Purpose

Create the project baseline that every later spec assumes already exists: enforced layering, strict tooling, CI gates, design tokens, accessible UI primitives, and the cross-cutting provider boundaries (auth, analytics, media, observability). It builds no commerce features.

## 2. In scope

- Repository layout and dependency-direction enforcement.
- Strict TypeScript, lint, format, unit/component/a11y/e2e tooling, Storybook.
- CI gates named `secret-scan`, `quality-gates`, `db-verification`.
- Validated environment configuration.
- Money utilities (integer ZAR cents).
- Design tokens (Day Softness and Evening Unwind), fonts, and base primitives including loading/empty/error states.
- `AuthService` guest contract, `AnalyticsProvider` allow-list boundary, `MediaProvider` view-mapper, server-side observability with PII scrubbing.
- Brand copy rule tests.
- Base layout, navigation shell, `robots` and `sitemap` scaffolding.

## 3. Out of scope

Catalogue data and pages (Spec 2), cart (Spec 3), checkout, orders, payments, shipping, admin, accounts and login screens, Gift Finder, AI, email sending, and any concrete payment/courier/auth vendor.

## 4. Requirements

### 4.1 Architecture and layering
- **R1.1 (MUST):** Source is organised as `src/ui`, `src/application`, `src/domain`, `src/data`, `src/integrations`, with `src/app` holding routes only. Dependency direction is UI → Application → Domain → Data/Integration → Providers.
- **R1.2 (MUST):** Lint and an architecture test fail the build if UI imports Prisma or a provider SDK, if Domain imports a framework, Prisma or provider, or if Prisma is imported outside `src/data`.
- **R1.3 (MUST):** No NestJS, no separate backend, no microservices.

### 4.2 Tooling and quality gates
- **R2.1 (MUST):** TypeScript `strict` is on, with `noUncheckedIndexedAccess`.
- **R2.2 (MUST):** Scripts exist for `lint`, `typecheck`, `format:check`, `test`, `test:e2e`, `storybook:build`, `build`, `db:verify`.
- **R2.3 (MUST):** CI jobs `secret-scan`, `quality-gates` (DB-free) and `db-verification` (Postgres service) exist and are required.
- **R2.4 (MUST):** axe checks run on component stories and on key routes.
- **R2.5 (SHOULD):** Dependency audit runs in `quality-gates`.

### 4.3 Configuration
- **R3.1 (MUST):** Environment is parsed with Zod, fails fast, and server-only values never reach client bundles.
- **R3.2 (MUST):** `.env.example` lists every variable. Variables for undecided vendors (payments, courier, auth, email, AI) are optional and unused until their spec.
- **R3.3 (MUST):** Secrets are never committed. `secret-scan` enforces this.

### 4.4 Money
- **R4.1 (MUST):** A `Money` module represents ZAR as integer cents. It provides add, multiply by integer, and formatting (`R 1 234,50` locale-aware). Floats are rejected.
- **R4.2 (MUST):** Overflow beyond `Number.MAX_SAFE_INTEGER` is rejected.

### 4.5 Design system
- **R5.1 (MUST):** Tokens live as CSS variables and Tailwind theme values for both Day Softness and Evening Unwind. Hex values and fonts are marked PROVISIONAL until design sign-off.
- **R5.2 (MUST):** Typography follows the Brand Bible pairing (Cormorant Garamond and Manrope), subject to font licensing sign-off (D-02).
- **R5.3 (MUST):** Primitives: Button, Link, TextField, Select, Checkbox, FormField (label, hint, error association), VisuallyHidden, LiveRegion, Skeleton, EmptyState, ErrorState, Notice, Price.
- **R5.4 (MUST):** All primitives are keyboard operable with visible focus, correct semantics, and meet WCAG 2.2 AA contrast for both themes (verified by axe, plus manual review noted in DoD).
- **R5.5 (MUST):** `prefers-reduced-motion` is honoured.
- **R5.6 (MUST):** Dark theme is selectable and persisted without flash. Matte black packaging direction is unaffected by theme.
- **R5.7 (MUST):** Every primitive has a Storybook story covering default, error, disabled and focus states.

### 4.6 Provider boundaries
- **R6.1 (MUST):** `AuthService` exposes `getActor(): Promise<{ kind: 'guest' }>`. Guest access is always permitted. No login UI.
- **R6.2 (MUST):** `AnalyticsProvider.track(event)` accepts only events in a typed allow-list. Unknown events are rejected at compile time and at runtime. Payloads carry no PII. Foundation registers an empty union that later specs extend.
- **R6.3 (MUST):** A no-op/console adapter is the default. A vendor adapter (for example PostHog) is added only after vendor confirmation.
- **R6.4 (MUST):** `MediaProvider` maps stored media references to a view model `{ mediaRef, alt, width, height }`. UI never sees vendor URLs or SDKs.
- **R6.5 (MUST):** Server-side error reporting (Sentry-compatible interface) scrubs PII and request bodies.

### 4.7 Brand and content rules
- **R7.1 (MUST):** A test fails if the word "ritual" appears in customer-facing source (existing `copy-rules.test.ts` is retained).
- **R7.2 (MUST):** No medical or therapeutic claim strings in shipped copy. A denylist test covers an agreed term list.
- **R7.3 (MUST):** Logo asset is used only as supplied. Final production logo file is a sign-off item.

### 4.8 App shell
- **R8.1 (MUST):** Root layout, header, footer, skip link, `<main>` landmark, and 404/500 pages use the primitives.
- **R8.2 (MUST):** `robots.ts` and `sitemap.ts` exist, with an explicit disallow list that later specs extend (`/search`, `/cart`, checkout).
- **R8.3 (SHOULD):** Open Graph defaults for social sharing (WhatsApp, Instagram, Pinterest).
- **R8.4 (MUST):** The placeholder homepage links (`/collections`, `/gift-finder`) must not 404 once shipped. Links to unbuilt routes are removed until their spec lands.

### 4.9 Next.js configuration
- **R9.1 (MUST):** The project uses Next.js 16 with `cacheComponents` and `partialPrefetching` already enabled. Request-time APIs (`cookies()`) are read only inside `<Suspense>` boundaries. Design follows `node_modules/next/dist/docs`, not prior-version conventions.

## 5. Testing requirements
- Unit: Money, allow-list, copy rules, env parsing.
- Component and axe: every primitive, both themes.
- Architecture: import-boundary tests.
- Build: production build and Storybook build succeed.

## 6. Open questions
- **Q1:** Final fonts, hex values, and contrast sign-off (owner/design).
- **Q2:** Analytics vendor (PostHog proposed, not confirmed).
- **Q3:** Error-reporting vendor (Sentry proposed, not confirmed).
- **Q4:** Hosting and managed Postgres vendor (Vercel and Neon/Supabase proposed, not confirmed). Affects the `db-verification` job only.

## 7. Definition of Done
All MUSTs implemented and tested, all CI jobs green, Storybook builds, axe clean, manual keyboard and screen-reader pass recorded, decision log updated.
