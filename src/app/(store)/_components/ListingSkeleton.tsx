import { Skeleton } from "@/ui/states/Skeleton";
import { ProductGridSkeleton } from "./ProductGrid";

export function ListingSkeleton({ label = "Loading products" }: { label?: string }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <Skeleton className="h-10 w-1/2" label={label} />
      <Skeleton className="h-24 w-full" />
      <ProductGridSkeleton />
    </div>
  );
}
