# Spec 1 Tasks: Foundation and Design System

Each task ends with its tests passing. Order follows dependencies.

- [x] 1. Decision log and repo hygiene
  - Create `docs/decision-log.md` (already seeded) and keep it current.
  - Confirm `.env` is git-ignored and not tracked (`git ls-files .env` is empty).
  - _Requirements: R3.3_

- [x] 2. Strict TypeScript and scripts
  - Enable `noUncheckedIndexedAccess`; fix fallout.
  - Add scripts `format:check`, `test:e2e`, `storybook:build`, `db:verify`.
  - Add Prettier config. Pin exact versions.
  - _Requirements: R2.1, R2.2_

- [x] 3. Folder layout and boundary rules
  - Create the `src/ui`, `application`, `domain`, `data`, `integrations` structure with README stubs.
  - Add ESLint `no-restricted-imports` overrides per folder.
  - Write `src/architecture.test.ts` and prove it fails on a deliberately bad fixture.
  - _Requirements: R1.1, R1.2, R1.3_

- [x] 4. Environment module
  - Rewrite `src/lib/env.ts` into `serverEnv()` and `publicEnv()`; drop Bobpay and `PAYMENT_PROVIDER`.
  - Update `.env.example`. Unit test valid, invalid and optional cases.
  - _Requirements: R3.1, R3.2_

- [x] 5. Money domain module
  - Implement `cents`, `add`, `mul`, `formatZar` in `src/domain/money`.
  - Tests: integer enforcement, overflow, negative rejection, formatting, no float drift.
  - _Requirements: R4.1, R4.2_

- [x] 6. Tokens, fonts and theme
  - Add semantic tokens for both themes. Switch to Manrope (flag as provisional in a code comment and decision log).
  - Implement no-flash theme script and `ThemeToggle`.
  - _Requirements: R5.1, R5.2, R5.5, R5.6_

- [x] 7. UI primitives and state components
  - Build primitives listed in Design §6 with stories.
  - Component tests with axe in both themes; keyboard tests for focus and activation.
  - _Requirements: R5.3, R5.4, R5.7_

- [x] 8. Storybook and a11y addon
  - Configure Storybook with theme switcher and a11y addon; `storybook:build` passes.
  - _Requirements: R2.2, R2.4, R5.7_

- [x] 9. Analytics allow-list boundary
  - Implement the event registry, strict Zod validation, no-op/console adapter.
  - Tests: unknown event rejected (type and runtime), extra keys rejected, PII-shaped values rejected by schema design.
  - _Requirements: R6.2, R6.3_

- [x] 10. AuthService, MediaProvider, ErrorReporter
  - Implement guest `AuthService`, local `MediaProvider` view-mapper, scrubbing `ErrorReporter` with a no-op adapter.
  - Tests: scrubber removes emails, phones, cookies, bodies.
  - _Requirements: R6.1, R6.4, R6.5_

- [x] 11. App shell, robots, sitemap, error pages
  - SkipLink, Header, Footer, `not-found`, `error`, `robots.ts` with extendable disallow list, `sitemap.ts` registry.
  - Trim placeholder homepage links to existing routes.
  - Wrap any request-time API usage in `<Suspense>` per `cacheComponents`.
  - _Requirements: R8.1, R8.2, R8.3, R8.4, R9.1_

- [x] 12. Brand copy rules
  - Keep the "ritual" test. Add the claims denylist test with an owner-approved term list (start with: cure, treat, heal, anxiety, insomnia, pain).
  - _Requirements: R7.1, R7.2_

- [x] 13. Playwright and route-level axe
  - Smoke test home, 404, and theme toggle with axe.
  - _Requirements: R2.2, R2.4_

- [x] 14. CI workflows
  - Add `.github/workflows` with `secret-scan`, `quality-gates`, `db-verification` (db job runs once Spec 2 adds the schema; stub step until then).
  - _Requirements: R2.3, R2.5_

- [x] 15. Definition of Done gate
  - Run format, lint, typecheck, tests, build, storybook build. Record manual keyboard and screen-reader notes. Update decision log.
  - _Requirements: all_
