import type { ProductsAvailability } from "./catalogue-service";
import type { ProductSummary } from "./views";

/**
 * Cached catalogue reads carry no trustworthy stock. This replaces each summary's availability
 * with the fresh value. A product with no fresh answer fails closed.
 */
export function overlayProductAvailability(
  items: readonly ProductSummary[],
  live: ProductsAvailability,
): ProductSummary[] {
  return items.map((item) => ({
    ...item,
    availability: live.byProductId.get(item.id) ?? "OUT_OF_STOCK",
  }));
}
