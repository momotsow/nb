import type { ProductSummary } from "@/application/catalogue";
import { ProductCard } from "@/ui/catalogue";

export function ProductGrid({
  items,
  availabilityDegraded = false,
  label,
}: {
  items: readonly ProductSummary[];
  availabilityDegraded?: boolean;
  /** Accessible name for the list, e.g. "Products". */
  label: string;
}) {
  return (
    <ul
      aria-label={label}
      className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4"
    >
      {items.map((product, i) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            priority={i < 4}
            availabilityDegraded={availabilityDegraded}
          />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-square animate-pulse rounded-xl bg-(--nb-border)" />
          <div className="h-4 w-3/4 animate-pulse rounded-md bg-(--nb-border)" />
          <div className="h-4 w-1/3 animate-pulse rounded-md bg-(--nb-border)" />
        </div>
      ))}
    </div>
  );
}
