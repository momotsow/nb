import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { parseListQuery } from "@/application/catalogue";
import { Listing, ListingHeader } from "../_components/Listing";
import { readShop } from "../_lib/catalogue-reads";
import { shopMetadata } from "../_lib/seo";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const { query } = parseListQuery(await searchParams);
  return shopMetadata(query.page);
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { query, invalidSlugs } = parseListQuery(await searchParams);
  if (invalidSlugs.length > 0) notFound();

  const view = await readShop({
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort,
    ...(query.categorySlug ? { categorySlug: query.categorySlug } : {}),
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <ListingHeader title="Shop" />
      <Listing
        basePath="/shop"
        view={view}
        sort={query.sort}
        extraParams={{ category: query.categorySlug }}
      />
    </div>
  );
}
