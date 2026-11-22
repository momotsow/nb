import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { parseSlug, type ProductDetailView } from "@/application/catalogue";
import { ProductGallery } from "@/ui/catalogue";
import { Link } from "@/ui/primitives/Link";
import { Skeleton } from "@/ui/states/Skeleton";
import { LiveProductGrid } from "../../_components/LiveProductGrid";
import { ProductGridSkeleton } from "../../_components/ProductGrid";
import { RelationshipBeacon } from "../../_components/RelationshipBeacon";
import { TrackOnMount } from "../../_components/TrackOnMount";
import { readProduct } from "../../_lib/catalogue-reads";
import { productMetadata } from "../../_lib/seo";
import { ProductPurchase } from "./ProductPurchase";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const slug = parseSlug((await params).slug);
  if (!slug) return {};
  const product = await readProduct(slug);
  return product ? productMetadata(product) : {};
}

/** Long-form facts, in reading order. A section renders only when its fact is present. */
function detailSections(p: ProductDetailView): { title: string; body: string }[] {
  const candidates: [string, string | null][] = [
    ["Description", p.description],
    ["Our story", p.story],
    ["Scent notes", p.scentNotes],
    ["Benefits", p.benefits],
    ["Ingredients", p.ingredients],
    ["How to use", p.directions],
    ["Safety information", p.safetyInfo],
    ["Warnings", p.warnings],
  ];
  return candidates.flatMap(([title, body]) =>
    body && body.trim() !== "" ? [{ title, body }] : [],
  );
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = parseSlug((await params).slug);
  if (!slug) notFound();
  const product = await readProduct(slug);
  if (!product) notFound();

  const sections = detailSections(product);

  return (
    <article className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">
      <TrackOnMount
        event="product_viewed"
        props={{ productId: product.id, productSlug: product.slug }}
      />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-3">
            {product.category ? (
              <p className="text-sm text-(--nb-muted)">
                <Link href={`/categories/${product.category.slug}`}>{product.category.name}</Link>
              </p>
            ) : null}
            <h1 className="text-4xl md:text-5xl">{product.name}</h1>
            {product.shortDesc ? (
              <p className="text-lg text-(--nb-muted)">{product.shortDesc}</p>
            ) : null}
          </header>
          <Suspense
            fallback={
              <div className="flex flex-col gap-4">
                <Skeleton className="h-11 w-2/3" label="Checking availability" />
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-11 w-40" />
              </div>
            }
          >
            <ProductPurchase product={product} />
          </Suspense>
        </div>
      </div>

      {sections.length > 0 ? (
        <div className="grid max-w-3xl gap-8">
          {sections.map((s) => (
            <section key={s.title} className="flex flex-col gap-2">
              <h2 className="text-2xl">{s.title}</h2>
              <p className="whitespace-pre-line text-(--nb-text)">{s.body}</p>
            </section>
          ))}
        </div>
      ) : null}

      {product.attributes.length > 0 ? (
        <section className="flex max-w-3xl flex-col gap-2">
          <h2 className="text-2xl">Details</h2>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-(--nb-text)">
            {product.attributes.map((a, i) => (
              <div key={`${a.key}-${i}`} className="contents">
                <dt className="text-(--nb-muted)">{a.key}</dt>
                <dd>{a.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      {product.collections.length > 0 ? (
        <nav aria-label="Collections" className="flex flex-wrap items-center gap-x-4">
          <span className="text-sm text-(--nb-muted)">Part of</span>
          {product.collections.map((c) => (
            <Link key={c.slug} href={`/collections/${c.slug}`} display="standalone">
              {c.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {product.related.length > 0 ? (
        <section aria-labelledby="related-heading" className="flex flex-col gap-6">
          <h2 id="related-heading" className="text-2xl">
            You may also like
          </h2>
          <RelationshipBeacon
            fromProductId={product.id}
            productIdsBySlug={Object.fromEntries(product.related.map((r) => [r.slug, r.id]))}
          >
            <Suspense fallback={<ProductGridSkeleton count={product.related.length} />}>
              <LiveProductGrid items={product.related} label="Related products" />
            </Suspense>
          </RelationshipBeacon>
        </section>
      ) : null}
    </article>
  );
}
