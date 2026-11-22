import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseListQuery, parseSlug } from "@/application/catalogue";
import { Listing, ListingHeader } from "../../_components/Listing";
import { TrackOnMount } from "../../_components/TrackOnMount";
import { readCategory } from "../../_lib/catalogue-reads";
import { categoryMetadata } from "../../_lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = parseSlug((await params).slug);
  if (!slug) return {};
  const { query } = parseListQuery(await searchParams);
  const view = await readCategory(slug, {
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  return view ? categoryMetadata(view, query.page) : {};
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = parseSlug((await params).slug);
  if (!slug) notFound();
  const { query } = parseListQuery(await searchParams);

  const view = await readCategory(slug, {
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  if (!view) notFound();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <TrackOnMount event="category_viewed" props={{ categorySlug: view.category.slug }} />
      <ListingHeader title={view.category.name} />
      <Listing
        basePath={`/categories/${view.category.slug}`}
        view={view.products}
        sort={query.sort}
      />
    </div>
  );
}
