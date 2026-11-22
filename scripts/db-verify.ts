// db:verify - asserts the public schema contains exactly the tables allowed at the
// current spec stage and none of the forbidden domains (R1.3).
// Later specs extend ALLOWED_TABLES in this file; FORBIDDEN_PATTERNS stays as is.
import { pathToFileURL } from "node:url";

export const ALLOWED_TABLES: readonly string[] = [
  "Category",
  "Collection",
  "ProductCollection",
  "Product",
  "ProductVariant",
  "ProductImage",
  "ProductAttribute",
  "RelatedProduct",
  "_prisma_migrations",
];

// Stock counts, reservations, movements, orders, payments, carts, users, discounts.
export const FORBIDDEN_PATTERNS: readonly RegExp[] = [
  /^stock/i,
  /^inventory/i,
  /^reservation/i,
  /movement/i,
  /^order/i,
  /^payment/i,
  /^cart/i,
  /^user/i,
  /^discount/i,
  /^coupon/i,
  /^voucher/i,
];

export interface VerifyResult {
  ok: boolean;
  forbidden: string[];
  unexpected: string[];
  missing: string[];
}

export function verifyTables(
  actual: readonly string[],
  allowed: readonly string[] = ALLOWED_TABLES,
  forbiddenPatterns: readonly RegExp[] = FORBIDDEN_PATTERNS,
): VerifyResult {
  const allowedSet = new Set(allowed);
  const actualSet = new Set(actual);
  const forbidden = actual.filter(
    (t) => !allowedSet.has(t) && forbiddenPatterns.some((p) => p.test(t)),
  );
  const unexpected = actual.filter((t) => !allowedSet.has(t) && !forbidden.includes(t));
  const missing = allowed.filter((t) => !actualSet.has(t));
  return {
    ok: forbidden.length + unexpected.length + missing.length === 0,
    forbidden: forbidden.sort(),
    unexpected: unexpected.sort(),
    missing: [...missing].sort(),
  };
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("db:verify - DATABASE_URL is not set.");
    process.exit(1);
  }
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    const result = verifyTables(rows.map((r) => r.table_name));
    if (result.ok) {
      console.log(`db:verify - OK (${rows.length} tables match the allowed set).`);
      return;
    }
    if (result.forbidden.length) console.error(`Forbidden tables: ${result.forbidden.join(", ")}`);
    if (result.unexpected.length)
      console.error(`Unexpected tables: ${result.unexpected.join(", ")}`);
    if (result.missing.length) console.error(`Missing tables: ${result.missing.join(", ")}`);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err: unknown) => {
    console.error("db:verify failed:", err);
    process.exit(1);
  });
}
