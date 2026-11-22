# Ndalo Bloom Decision Log

The handover pack requires a decision log and recorded assumptions. Status values: PROPOSED (my recommendation, needs owner OK), OPEN (owner must decide), ACCEPTED.
Last updated: 18 November 2026.

| ID | Decision / assumption | Status | Owner | Affects |
|---|---|---|---|---|
| D-01 | Specs 1 and 2 were not in the handover pack. Their requirements are reconstructed from references in Specs 3/4, the Brief and the Technical prompt. Spec 3 mentions an applied migration `20260918124342_catalogue_init`, but this repo has no migrations, so a fresh `catalogue_init` is created. | PROPOSED | Owner: confirm or supply originals | Specs 1, 2 |
| D-02 | Scaffold loads DM Sans. Brand Bible names Manrope. Proposal: switch to Manrope. Hex values and font licensing remain provisional until design sign-off. Implemented in `src/app/layout.tsx` (Manrope via `next/font/google`, `--font-manrope`) and flagged PROVISIONAL in code; new semantic token values (`--nb-focus/danger/success/border/muted`) are also provisional. | PROPOSED (implemented, provisional) | Owner / design | Spec 1 |
| D-03 | `prisma/schema.prisma` v0.1 draft is reduced to catalogue models for Spec 2. The full draft is archived at `docs/deferred/schema-v0.1-draft.prisma`. Other models return in their own specs. | PROPOSED | Owner | Spec 2 |
| D-04 | `.env.example` and `src/lib/env.ts` hard-code `PAYMENT_PROVIDER=bobpay`. The Technical prompt says no payment provider is chosen (Paystack and PayFast were also mentioned). Proposal: remove provider settings until the Payments spec. | OPEN (payment provider) | Owner | Spec 1, Payments |
| D-05 | Draft `saleCents` dropped (no sale-pricing requirement). Seed data is fictional, prefixed `SEED-`. The provisional launch boxes and planning prices (R699/R749/R899) are not used as data. | PROPOSED | Owner | Spec 2 |
| D-06 | Cart stores `lastSeenPriceCents` per line solely to detect price changes (FR-13). It is never displayed or used for totals. Re-baselined when the customer updates quantity or re-adds the line. Consequence: the "price updated" notice stays until then. | PROPOSED | Owner | Spec 3 |
| D-07 | Rate limiting uses a Postgres-backed counter behind a `RateLimiter` interface (serverless instances cannot share in-memory counters; no new infrastructure). Spec 2 search uses a dev-only in-memory placeholder until Spec 3 lands. | PROPOSED | Owner | Specs 2, 3 |
| D-08 | No inventory system exists. Spec 2 ships a read-only availability interface plus a test stub. Production refuses to start without a registered implementation. **Launch blocker:** an Inventory spec (or a manually maintained availability source) must exist before go-live. | OPEN | Owner | Specs 2, 3, 4 |
| D-09 | `search_performed` analytics carries query length and result count, not the raw query, to keep personal data out of analytics. | PROPOSED | Owner | Spec 2 |
| D-10 | Expired carts are ignored on read and purged opportunistically on mutation. No scheduler. | PROPOSED | Owner | Spec 3 |
| D-11 | Cart subtotal excludes lines flagged unavailable, so the customer never sees a figure that includes something they cannot buy. Source requirements say "subtotal" without stating this. | OPEN (needs confirmation) | Owner | Spec 3 |
| D-12 | Display-only discount/shipping placeholders (allowed as MAY) are not built. | PROPOSED | Owner | Spec 3 |
| D-13 | Cart 30-day retention slides on mutations only, because cookies cannot be set during render. | PROPOSED | Owner | Spec 3 |
| D-14 | Claims denylist (R7.2) starts as: cure, treat, heal, anxiety, insomnia, pain, plus common inflections (e.g. treatment, healing, cures, painful). Enforced by `src/lib/copy-rules.test.ts`; extend the `CLAIMS_DENYLIST` constant there. Scope is all `src` files except tests, stories, `.d.ts` and `generated`. Code comments are scanned too. | PROPOSED | Owner: approve or extend list | Spec 1 |

## Spec 1 Definition of Done record

Automated gates run locally, all passing: `format:check`, `lint`, `typecheck`, `test` (14 files, 116 tests, includes axe in both themes and keyboard tests), `build` (Next.js production build), `storybook:build`, `test:e2e` (5 Playwright tests with axe on home, 404 and theme toggle, both themes). CI workflow results are not verified here; they run on GitHub once pushed.

Keyboard notes (automated only): focus visibility and Enter/Space activation of primitives are covered by component keyboard tests; skip link, theme toggle persistence and no-flash are covered by Playwright. No manual pass in a real browser has been recorded.

Screen-reader review: **PENDING human sign-off.** No NVDA, JAWS, VoiceOver or TalkBack testing was done. axe clean results do not replace it. Spec 1 Definition of Done is not fully met until a person records this pass.

## Open business decisions carried from the handover (unresolved, not decided here)

- Spec 4 UQ-1 tax/VAT treatment; UQ-2 Orders/Payments/Shipping contracts and order; UQ-3 terms, privacy and retention; UQ-4 telephone required. Spec 4 stays blocked on these.
- Payment provider, courier provider, auth provider, hosting/DB vendor, analytics vendor, error-reporting vendor, media vendor, AI provider.
- Final brand assets: logo master file, Figma frames, hex values, fonts.
- Product formulations, claims, prices, packaging and suppliers.

## Notes on the existing repo (not changed by these specs yet)

- `.env` exists on disk and is git-ignored. Spec 1 task 1 verifies it is not tracked.
- `next.config.ts` has `cacheComponents` and `partialPrefetching` on. Designs account for this.
- The Spec 4 Tasks draft (`Latest_Project_Update_2026-11-10_A/B.txt`, identical files) references a Design document that was not in the pack.
