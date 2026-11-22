import { overlayProductAvailability, type ProductSummary } from "@/application/catalogue";
import { liveCatalogue } from "@/application/catalogue/runtime";
import { Notice } from "@/ui/primitives/Notice";
import { ProductGrid } from "./ProductGrid";

/**
 * Reads availability fresh on every render (never cached with the product data) and overlays it
 * on the cached summaries. Render this inside <Suspense>.
 */
export async function LiveProductGrid({
  items,
  label,
}: {
  items: readonly ProductSummary[];
  label: string;
}) {
  const service = await liveCatalogue();
  const live = await service.getProductsAvailability(items.map((i) => i.id));
  return (
    <div className="flex flex-col gap-4">
      {live.degraded ? (
        <Notice tone="error" title="Availability is temporarily unavailable">
          We could not check stock just now, so products show as unavailable. Please try again
          shortly.
        </Notice>
      ) : null}
      <ProductGrid
        items={overlayProductAvailability(items, live)}
        availabilityDegraded={live.degraded}
        label={label}
      />
    </div>
  );
}
