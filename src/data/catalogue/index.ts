import { serverEnv } from "@/lib/env";
import { createCatalogueData } from "./catalogue-data";
import type { CatalogueData } from "./types";

export { createCatalogueData } from "./catalogue-data";
export type * from "./types";

let shared: CatalogueData | undefined;
/** Process-wide instance using DATABASE_URL. */
export function getCatalogueData(): CatalogueData {
  shared ??= createCatalogueData({ connectionString: serverEnv().DATABASE_URL });
  return shared;
}
