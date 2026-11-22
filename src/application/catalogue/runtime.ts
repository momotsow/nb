// Composition root for the catalogue. Routes import this instead of the data layer or adapters.
// Two services are exposed on purpose:
//  - catalogueReads(): safe to call inside `'use cache'`. Its availability is neutral (every key
//    fails closed), so no stock value is ever stored with cached product data.
//  - liveCatalogue(): uses the registered availability provider. Call it outside the cache.
import { getCatalogueData } from "@/data/catalogue";
import { getAvailabilityProvider } from "@/integrations/availability/config";
import { withFailClosed, type FailClosedAvailability } from "@/integrations/availability/provider";
import { createLocalMediaProvider } from "@/integrations/media/adapters/local";
import { createErrorReporter } from "@/integrations/observability/error-reporter";
import { createCatalogueService, type CatalogueService } from "./catalogue-service";

const neutralAvailability: FailClosedAvailability = {
  async getAvailability(stockKeys) {
    return {
      availability: new Map(stockKeys.map((k) => [k, "OUT_OF_STOCK" as const])),
      degraded: false,
    };
  },
};

const reporter = createErrorReporter();
const media = createLocalMediaProvider();

let reads: CatalogueService | undefined;
export function catalogueReads(): CatalogueService {
  reads ??= createCatalogueService({
    data: getCatalogueData(),
    availability: neutralAvailability,
    media,
  });
  return reads;
}

let live: CatalogueService | undefined;
/**
 * Outside production the deterministic stub is used with the seed fixtures. In production this
 * throws unless a real provider is registered (see getAvailabilityProvider).
 */
export async function liveCatalogue(): Promise<CatalogueService> {
  if (live) return live;
  const appEnv = process.env.APP_ENV;
  const fixtures =
    appEnv === "production"
      ? {}
      : (await import("../../../prisma/seed-data")).seedAvailabilityFixtures;
  live = createCatalogueService({
    data: getCatalogueData(),
    availability: withFailClosed(getAvailabilityProvider(appEnv, fixtures), reporter),
    media,
  });
  return live;
}
