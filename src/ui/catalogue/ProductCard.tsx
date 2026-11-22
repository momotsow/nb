import { cents } from "@/domain/money/money";
import { Link } from "../primitives/Link";
import { Price } from "../primitives/Price";
import { AvailabilityNotice } from "./AvailabilityNotice";
import type { ProductSummary } from "./types";

export type ProductCardProps = {
  product: ProductSummary;
  /** Mark the first row of a listing so the browser can load it eagerly. */
  priority?: boolean;
  /** Availability could not be read; show the degraded message instead of a stock state. */
  availabilityDegraded?: boolean;
};

export function ProductCard({
  product,
  priority = false,
  availabilityDegraded = false,
}: ProductCardProps) {
  const { hero } = product;
  return (
    <article className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-(--nb-surface)">
        {hero ? (
          // Media is resolved by MediaProvider (CDN or local path) with fixed dimensions.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={hero.mediaRef}
            alt={hero.alt}
            width={hero.width}
            height={hero.height}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="size-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="size-full" />
        )}
      </div>
      <h3 className="text-base font-medium text-(--nb-text)">
        <Link href={`/products/${product.slug}`} display="standalone">
          {product.name}
        </Link>
      </h3>
      {product.shortDesc ? <p className="text-sm text-(--nb-muted)">{product.shortDesc}</p> : null}
      <p className="text-sm text-(--nb-text)">
        {product.priceIsRange ? <span>From </span> : null}
        <Price amount={cents(product.priceFromCents)} />
      </p>
      <AvailabilityNotice availability={product.availability} degraded={availabilityDegraded} />
    </article>
  );
}
