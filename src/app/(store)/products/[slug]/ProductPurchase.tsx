import type { ProductDetailView } from "@/application/catalogue";
import { liveCatalogue } from "@/application/catalogue/runtime";
import { selectDefaultVariant, type Availability } from "@/domain/catalogue/catalogue";
import { serialiseJsonLd } from "@/lib/seo";
import { VariantSelector } from "@/ui/catalogue";
import { Notice } from "@/ui/primitives/Notice";
import { productJsonLd } from "../../_lib/seo";

/**
 * Price, availability and the (inert) add-to-cart slot. Availability is read fresh here, outside
 * the cached product read, and this component renders inside <Suspense>. Prices come from the
 * cached product facts; nothing the browser sends back is trusted as a price.
 */
export async function ProductPurchase({ product }: { product: ProductDetailView }) {
  const service = await liveCatalogue();
  const live = await service.getVariantsAvailability(product.variants.map((v) => v.id));

  const variants = product.variants.map((v) => {
    const fresh = live.byVariantId.get(v.id);
    return {
      ...v,
      availability: fresh?.availability ?? ("OUT_OF_STOCK" as const),
      isPurchasable: fresh?.isPurchasable ?? false,
    };
  });

  const stockById = new Map<string, Availability>(variants.map((v) => [v.id, v.availability]));
  const def = selectDefaultVariant(
    "ACTIVE",
    variants.map((v) => ({ id: v.id, priceCents: v.priceCents, active: true })),
    stockById,
  );

  const jsonLd = productJsonLd(product, stockById);

  return (
    <div className="flex flex-col gap-4">
      {/* Offer availability is the fresh provider value (fail-closed), never the cached one. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serialiseJsonLd(jsonLd) }}
      />
      {live.degraded ? (
        <Notice tone="error" title="Availability is temporarily unavailable">
          We could not check stock just now. Please try again shortly.
        </Notice>
      ) : null}
      <VariantSelector
        variants={variants}
        defaultVariantId={def?.id ?? product.defaultVariantId}
        availabilityDegraded={live.degraded}
      />
    </div>
  );
}
