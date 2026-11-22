import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseListQuery, parseSlug } from "@/application/catalogue";
import { Listing, ListingHeader } from "../../_components/Listing";
import { TrackOnMount } from "../../_components/TrackOnMount";
import { readCollection } from "../../_lib/catalogue-reads";
import { collectionMetadata } from "../../_lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const slug = parseSlug((await params).slug);
  if (!slug) return {};
  const { query } = parseListQuery(await searchParams);
  const view = await readCollection(slug, {
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  // The page itself calls notFound(); metadata just stays empty.
  return view ? collectionMetadata(view, query.page) : {};
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const slug = parseSlug((await params).slug);
  if (!slug) notFound();
  const { query } = parseListQuery(await searchParams);

  const view = await readCollection(slug, {
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
  });
  if (!view) notFound();

  const { collection } = view;
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <TrackOnMount event="collection_viewed" props={{ collectionSlug: collection.slug }} />
      <ListingHeader title={collection.name} intro={collection.tagline} />
      {collection.hero ? (
        // Media is resolved by MediaProvider with fixed dimensions.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={collection.hero.mediaRef}
          alt={collection.hero.alt}
          width={collection.hero.width}
          height={collection.hero.height}
          decoding="async"
          className="aspect-[3/1] w-full rounded-xl object-cover"
        />
      ) : null}
      {collection.story ? <p className="max-w-2xl text-(--nb-text)">{collection.story}</p> : null}
      <Listing
        basePath={`/collections/${collection.slug}`}
        view={view.products}
        sort={query.sort}
      />
    </div>
  );
}
