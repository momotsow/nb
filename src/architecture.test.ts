import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { afterAll, describe, expect, it } from "vitest";

// Enforces UI -> Application -> Domain -> Data/Integration -> Providers.
// Duplicates the ESLint rules on purpose so config drift is caught.

const PRISMA = /^@prisma\/client|generated\/prisma/;
// Provider SDKs and drivers: only data/ (database driver) and integrations/ may import them.
const PROVIDER_SDK =
  /^(pg|@prisma\/adapter-pg|cloudinary|resend|@sentry\/|posthog|@vercel\/|stripe|@aws-sdk\/)/;
const FRAMEWORK = /^(next|react|react-dom)(\/|$)/;
const REACT = /^(react|react-dom)(\/|$)/;

const LAYERS = ["app", "ui", "application", "domain", "data", "integrations", "lib"] as const;
type Layer = (typeof LAYERS)[number] | "other";

// Layers each layer must NOT import from.
const FORBIDDEN: Record<Layer, readonly Layer[]> = {
  app: ["data"],
  ui: ["data", "app", "integrations"],
  application: ["ui", "app"],
  domain: ["data", "integrations", "application", "ui", "app"],
  data: ["ui", "app", "application"],
  integrations: ["ui", "app", "application"],
  lib: [],
  other: [],
};

function layerOf(root: string, absPath: string): Layer {
  const top = relative(root, absPath).split(sep)[0] ?? "";
  return LAYERS.find((l) => l === top) ?? "other";
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (p.includes(`${sep}generated`)) return [];
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

function importsOf(file: string): string[] {
  return ts
    .preProcessFile(readFileSync(file, "utf8"), true, true)
    .importedFiles.map((i) => i.fileName);
}

function resolveTarget(root: string, from: string, spec: string): string | null {
  if (spec.startsWith("@/")) return join(root, spec.slice(2));
  if (spec.startsWith(".")) return resolve(dirname(from), spec);
  return null;
}

export function violations(root: string): string[] {
  const out: string[] = [];
  const sources = files(root).filter(
    (f) => /\.(ts|tsx)$/.test(f) && !f.endsWith("architecture.test.ts"),
  );
  for (const file of sources) {
    const layer = layerOf(root, file);
    const name = relative(root, file).split(sep).join("/");
    for (const spec of importsOf(file)) {
      if (PRISMA.test(spec) && layer !== "data")
        out.push(`${name} (${layer}) imports Prisma (${spec})`);
      if (PROVIDER_SDK.test(spec) && layer !== "data" && layer !== "integrations")
        out.push(`${name} (${layer}) imports provider SDK (${spec})`);
      if (layer === "domain" && FRAMEWORK.test(spec))
        out.push(`${name} (domain) imports framework (${spec})`);
      if (layer === "application" && REACT.test(spec))
        out.push(`${name} (application) imports React`);
      const target = resolveTarget(root, file, spec);
      if (target) {
        const targetLayer = layerOf(root, target);
        if (FORBIDDEN[layer].includes(targetLayer)) {
          out.push(`${name} (${layer}) must not import ${targetLayer} (${spec})`);
        }
      }
    }
  }
  return out;
}

describe("architecture boundaries", () => {
  it("has no layer violations in src", () => {
    expect(violations(resolve("src"))).toEqual([]);
  });

  // Spec 2 folders must exist and be covered by the layer rules (R3.3).
  it("covers the catalogue folders and routes", () => {
    const src = resolve("src");
    const covered = [
      "domain/catalogue",
      "data/catalogue",
      "integrations/availability",
      "application/catalogue",
      "ui/catalogue",
      "app/(store)",
    ];
    for (const dir of covered) {
      const abs = join(src, ...dir.split("/"));
      expect(statSync(abs).isDirectory(), `${dir} exists`).toBe(true);
      expect(
        files(abs).filter((f) => /\.(ts|tsx)$/.test(f)).length,
        `${dir} has sources`,
      ).toBeGreaterThan(0);
    }
  });

  it("keeps Prisma, drivers and provider SDKs out of ui, routes, application and domain", () => {
    const src = resolve("src");
    const bad = violations(src).filter(
      (v) => /^(ui|app|application|domain)\//.test(v) && /imports (Prisma|provider SDK)/.test(v),
    );
    expect(bad).toEqual([]);
  });

  it("keeps ui/catalogue free of data, integrations and route imports", () => {
    const bad = violations(resolve("src")).filter((v) => v.startsWith("ui/catalogue/"));
    expect(bad).toEqual([]);
  });

  describe("detector fails on bad fixtures", () => {
    const tmp = mkdtempSync(join(tmpdir(), "nb-arch-"));
    afterAll(() => rmSync(tmp, { recursive: true, force: true }));

    const write = (rel: string, body: string) => {
      const p = join(tmp, rel);
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, body);
    };

    it("flags each forbidden import", () => {
      write("domain/a.ts", 'import { useState } from "react";\nimport "@/data/x";\n');
      write("ui/b.tsx", 'import { PrismaClient } from "@prisma/client";\nimport "@/data/x";\n');
      write("application/c.ts", 'import "react";\nimport "@/ui/y";\n');
      write("data/x.ts", "export const x = 1;\n");
      write("ui/ok.tsx", 'import "@/application/z";\n');
      write("ui/catalogue/d.tsx", 'import "pg";\nimport "@/integrations/availability/stub";\n');
      const found = violations(tmp);
      expect(found).toEqual(
        expect.arrayContaining([
          expect.stringContaining("domain/a.ts (domain) imports framework"),
          expect.stringContaining("domain/a.ts (domain) must not import data"),
          expect.stringContaining("ui/b.tsx (ui) imports Prisma"),
          expect.stringContaining("ui/b.tsx (ui) must not import data"),
          expect.stringContaining("application/c.ts (application) imports React"),
          expect.stringContaining("application/c.ts (application) must not import ui"),
          expect.stringContaining("ui/catalogue/d.tsx (ui) imports provider SDK (pg)"),
          expect.stringContaining("ui/catalogue/d.tsx (ui) must not import integrations"),
        ]),
      );
      expect(found.some((v) => v.includes("ui/ok.tsx"))).toBe(false);
    });
  });
});
