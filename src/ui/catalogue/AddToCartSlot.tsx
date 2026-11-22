import { Button } from "../primitives/Button";

export type AddToCartSlotProps = {
  variantId: string;
  /** Why the button is disabled. Always shown as text next to the button. */
  disabledReason: string;
};

/**
 * Inert until Spec 3 supplies cart behaviour. Spec 3 replaces this implementation and keeps
 * the same props, so the product page does not change.
 */
export function AddToCartSlot({ variantId, disabledReason }: AddToCartSlotProps) {
  const reasonId = `add-to-cart-reason-${variantId}`;
  return (
    <div className="flex flex-col gap-2" data-variant-id={variantId}>
      <Button disabled aria-describedby={reasonId} className="w-full sm:w-auto">
        Add to cart
      </Button>
      <p id={reasonId} className="text-sm text-(--nb-muted)">
        {disabledReason}
      </p>
    </div>
  );
}
