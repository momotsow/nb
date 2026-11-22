import { Skeleton } from "@/ui/states/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-2">
      <div aria-hidden="true" className="aspect-square animate-pulse rounded-xl bg-(--nb-border)" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-3/4" label="Loading the product" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    </div>
  );
}
