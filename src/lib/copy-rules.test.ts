import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";
import { describe, expect, it } from "vitest";

// Business rule 13: the word "ritual" must not appear in customer-facing content.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

/**
 * R7.2 claims denylist. Owner-approved list of base terms that imply a medical
 * or therapeutic claim. Extend this list to widen the check; common inflections
 * (e.g. treatment, healing, cures, painful) are matched automatically.
 */
export const CLAIMS_DENYLIST: readonly string[] = [
  "cure",
  "treat",
  "heal",
  "anxiety",
  "insomnia",
  "pain",
];

const INFLECTIONS = "(?:s|d|ed|es|ing|ment|ments|er|ers|ful)?";

function claimsPattern(terms: readonly string[]): RegExp {
  const stems = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(?:${stems.join("|")})${INFLECTIONS}\\b`, "gi");
}

// Customer-facing source: everything in src except tests, stories, type
// declarations and generated code.
function isCustomerFacing(file: string): boolean {
  return (
    /\.(tsx?|md|mdx|json)$/.test(file) &&
    !/\.(test|spec|stories)\.[jt]sx?$/.test(file) &&
    !file.endsWith(".d.ts") &&
    !file.split(sep).includes("generated")
  );
}

describe("brand copy rules", () => {
  it('never uses the word "ritual" in src', () => {
    const offenders = walk("src")
      .filter((f) => /\.(tsx?|md|mdx|json)$/.test(f) && !f.endsWith("copy-rules.test.ts"))
      .filter((f) => /ritual/i.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("matches denylisted terms and their inflections, but not look-alikes", () => {
    const re = claimsPattern(CLAIMS_DENYLIST);
    for (const bad of ["Cure", "cures", "treatment", "Healing", "anxiety", "insomnia", "painful"]) {
      expect(bad.match(re), bad).not.toBeNull();
    }
    for (const ok of ["health", "paint", "treasure", "heather", "curious"]) {
      expect(ok.match(re), ok).toBeNull();
    }
  });

  it("contains no medical or therapeutic claim terms in customer-facing source", () => {
    const offenders = walk("src")
      .filter(isCustomerFacing)
      .flatMap((f) => {
        const hits = readFileSync(f, "utf8").match(claimsPattern(CLAIMS_DENYLIST));
        return hits ? [`${f}: ${[...new Set(hits.map((h) => h.toLowerCase()))].join(", ")}`] : [];
      });
    expect(offenders).toEqual([]);
  });

  it("applies the same rules to catalogue seed data and seed script", () => {
    const files = ["prisma/seed-data.ts", "prisma/seed.ts"];
    const offenders = files.flatMap((f) => {
      const text = readFileSync(f, "utf8");
      const out: string[] = [];
      if (/ritual/i.test(text)) out.push(`${f}: ritual`);
      const hits = text.match(claimsPattern(CLAIMS_DENYLIST));
      if (hits) out.push(`${f}: ${[...new Set(hits.map((h) => h.toLowerCase()))].join(", ")}`);
      return out;
    });
    expect(offenders).toEqual([]);
  });
});
