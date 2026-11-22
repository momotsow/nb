import { Suspense } from "react";
import type { ProductListView } from "@/application/catalogue";
import { Filters, Pagination } from "@/ui/catalogue";
import { Link } from "@/ui/primitives/Link";
import { EmptyState } from "@/ui/states/EmptyState";
import { LiveProductGrid } from "./LiveProductGrid";
import { ProductGridSkeleton } from "./ProductGrid";

/** Header block shared by listing pages. Only renders the facts that are present. */
export function ListingHeader({
  title,
  intro,
}: {
  title: string;
  intro?: string | null | undefined;
}) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-4xl md:text-5xl">{title}</h1>
      {intro ? <p className="max-w-2xl text-lg text-(--nb-muted)">{intro}</p> : null}
    </header>
  );
}

/**
 * Filters, product grid, pagination and the empty states for a cached ProductListView.
 * The grid streams in behind Suspense because it reads fresh availability.
 */
export function Listing({
  basePath,
  view,
  sort,
  extraParams,
}: {
  basePath: string;
  view: ProductListView;
  sort: string;
  /** Query params other than page that pagination links must keep. */
  extraParams?: Readonly<Record<string, string | undefined>>;
}) {
  const hasItems = view.items.length > 0;
  return (
    <div className="flex flex-col gap-8">
      <Filters action={basePath} values={{ sort }} />
      <section aria-labelledby="listing-heading" className="flex flex-col gap-6">
        <h2 id="listing-heading" className="sr-only">
          Products
        </h2>
        {hasItems ? (
          <Suspense fallback={<ProductGridSkeleton />}>
            <LiveProductGrid items={view.items} label="Products" />
          </Suspense>
        ) : view.total > 0 ? (
          <EmptyState
            title="No products on this page"
            description="That page is past the end of the list."
            action={
              <Link href={basePath} display="standalone">
                Back to the first page
              </Link>
            }
          />
        ) : (
          <EmptyState
            title="No products to show yet"
            description="Nothing matches here right now. Try clearing the filters or check back soon."
            action={
              <Link href="/shop" display="standalone">
                Browse the shop
              </Link>
            }
          />
        )}
        <Pagination
          basePath={basePath}
          page={view.page}
          pageCount={view.pageCount}
          params={{ sort: sort === "featured" ? undefined : sort, ...extraParams }}
        />
      </section>
    </div>
  );
}
