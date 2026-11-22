import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Layering: UI -> Application -> Domain -> Data/Integration -> Providers.
// Mirrored by src/architecture.test.ts so config drift is caught.
const prisma = [
  "@prisma/client",
  "@prisma/client/*",
  "**/generated/prisma",
  "**/generated/prisma/*",
];

const forbid = (message, ...groups) => ({
  "no-restricted-imports": [
    "error",
    { patterns: groups.flat().map((group) => ({ group: [group], message })) },
  ],
});

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/ui/**/*.{ts,tsx}", "src/app/**/*.{ts,tsx}"],
    rules: forbid(
      "UI and routes must not import Prisma, the data layer or provider adapters.",
      prisma,
      ["@/data", "@/data/*", "**/data/*"],
      ["**/integrations/**/adapters/**"],
    ),
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: forbid(
      "Domain must stay framework/provider independent.",
      prisma,
      ["next", "next/*", "react", "react-dom", "react/*"],
      [
        "@/data",
        "@/data/*",
        "@/integrations",
        "@/integrations/*",
        "@/application",
        "@/application/*",
        "@/ui",
        "@/ui/*",
        "@/app",
        "@/app/*",
      ],
    ),
  },
  {
    files: ["src/application/**/*.ts"],
    rules: forbid(
      "Application must not depend on UI, routes or React.",
      prisma,
      ["react", "react-dom", "react/*"],
      ["@/ui", "@/ui/*", "@/app", "@/app/*"],
    ),
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);

export default eslintConfig;
