import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    // Component tests opt into jsdom with `// @vitest-environment jsdom`.
    environment: "node",
    exclude: ["node_modules/**", ".next/**", "e2e/**"],
  },
});
