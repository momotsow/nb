import type { Metadata } from "next";
import { headers } from "next/headers";
import { connection } from "next/server";
import { Suspense } from "react";
import { PAGE_SIZE, parseSearchQuery, MAX_QUERY_LENGTH } from "@/application/catalogue";
import { catalogueReads } from "@/application/catalogue/runtime";
import { getRateLimiter } from "@/integrations/ratelimit/config";
import { checkSearchRateLimit } from "@/integrations/ratelimit/rate-limiter";
import { Pagination } from "@/ui/catalogue";
import { Button } from "@/ui/primitives/Button";
import { Link } from "@/ui/primitives/Link";
import { Notice } from "@/ui/primitives/Notice";
import { TextField } from "@/ui/primitives/TextField";
import { EmptyState } from "@/ui/states/EmptyState";
import { LiveProductGrid } from "../_components/LiveProductGrid";
import { ListingHeader } from "../_components/Listing";
import { ListingSkeleton } from "../_components/ListingSkeleton";
import { ProductGridSkeleton } from "../_components/ProductGrid";
import { TrackOnMount } from "../_components/TrackOnMount";
import { searchMetadata } from "../_lib/seo";

// Search results are not for indexing (R6.3). The raw query is never sent to analytics.
export const metadata: Metadata = searchMetadata();

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // searchParams and headers are request-time data, so they are read inside Suspense.
  return (
    <Suspense fallback={<ListingSkeleton label="Loading search" />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

function SearchForm({ q }: { q: string }) {
  return (
    <form method="get" action="/search" role="search" aria-label="Search products">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-md">
          <TextField
            label="Search products"
            name="q"
            type="search"
            defaultValue={q}
            maxLength={MAX_QUERY_LENGTH}
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
}

async function clientKey(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip") || "unknown";
}

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { q, page } = parseSearchQuery(await searchParams);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <ListingHeader title="Search" />
      <SearchForm q={q} />
      <section aria-labelledby="search-results-heading" className="flex flex-col gap-6">
        <h2 id="search-results-heading" className="sr-only">
          Search results
        </h2>
        {q === "" ? (
          <EmptyState
            title="What are you looking for?"
            description="Search by product name, description or scent notes."
            action={
              <Link href="/shop" display="standalone">
                Browse the shop
              </Link>
            }
          />
        ) : (
          <Results q={q} page={page} />
        )}
      </section>
    </div>
  );
}

function emptyResults(total: number, q: string) {
  return total > 0 ? (
    <EmptyState
      title="No results on this page"
      description="That page is past the end of the results."
      action={
        <Link href={`/search?q=${encodeURIComponent(q)}`} display="standalone">
          Back to the first page
        </Link>
      }
    />
  ) : (
    <EmptyState
      title="No results found"
      description="Check the spelling or try a different word. You can also browse everything in the shop."
      action={
        <Link href="/shop" display="standalone">
          Browse the shop
        </Link>
      }
    />
  );
}

async function Results({ q, page }: { q: string; page: number }) {
  // The limiter reads the clock, so only run it for a real request (never in a prerender pass).
  await connection();
  const gate = await checkSearchRateLimit(getRateLimiter(), await clientKey());
  if (!gate.allowed) {
    return (
      <Notice tone="error" title="Too many searches">
        Please wait a minute and try again.
      </Notice>
    );
  }

  const view = await catalogueReads().search(q, page, PAGE_SIZE);

  const track = (
    <TrackOnMount
      event="search_performed"
      props={{ queryLength: q.length, resultCount: view.total }}
    />
  );

  if (view.items.length === 0) {
    return (
      <>
        {track}
        {emptyResults(view.total, q)}
      </>
    );
  }

  return (
    <>
      {track}
      <p role="status" className="text-(--nb-muted)">
        {view.total} {view.total === 1 ? "result" : "results"}
      </p>
      <Suspense fallback={<ProductGridSkeleton />}>
        <LiveProductGrid items={view.items} label="Search results" />
      </Suspense>
      <Pagination basePath="/search" page={view.page} pageCount={view.pageCount} params={{ q }} />
    </>
  );
}
