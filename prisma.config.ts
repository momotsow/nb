import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { seed: "node prisma/seed.ts" },
  datasource: {
    url: process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/ndalo_bloom",
  },
});
