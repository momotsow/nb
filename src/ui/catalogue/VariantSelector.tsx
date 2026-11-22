"use client";

import { useId, useState } from "react";
import { cents, formatZar } from "@/domain/money/money";
import { LiveRegion, useAnnouncer } from "../primitives/LiveRegion";
import { Price } from "../primitives/Price";
import { AddToCartSlot } from "./AddToCartSlot";
import { AvailabilityNotice, availabilityText, DEGRADED_TEXT } from "./AvailabilityNotice";
import type { VariantView } from "./types";

export type VariantSelectorProps = {
  variants: readonly VariantView[];
  defaultVariantId: string;
  availabilityDegraded?: boolean;
  /** Legend text for the radio group. */
  legend?: string;
};

function statusMessage(variant: VariantView, degraded: boolean): string {
  const stock = degraded ? DEGRADED_TEXT : availabilityText[variant.availability];
  return `${variant.name}, ${formatZar(cents(variant.priceCents))}. ${stock}.`;
}

function disabledReason(variant: VariantView, degraded: boolean): string {
  if (degraded) return DEGRADED_TEXT;
  if (!variant.isPurchasable) return "This option is out of stock.";
  return "Adding to cart is not available yet.";
}

/**
 * Radio group: arrow keys move between options natively. The selected variant drives the price,
 * availability and add-to-cart slot. Nothing from here is sent back as a price.
 */
export function VariantSelector({
  variants,
  defaultVariantId,
  availabilityDegraded = false,
  legend = "Choose an option",
}: VariantSelectorProps) {
  const groupName = useId();
  const [selectedId, setSelectedId] = useState(defaultVariantId);
  const [message, announce] = useAnnouncer();
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium text-(--nb-text)">{legend}</legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <label
              key={variant.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-(--nb-border) bg-(--nb-surface) px-4 text-sm text-(--nb-text) has-checked:border-2 has-checked:border-(--nb-text) has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
            >
              <input
                type="radio"
                name={groupName}
                value={variant.id}
                checked={variant.id === selected.id}
                onChange={() => {
                  setSelectedId(variant.id);
                  announce(statusMessage(variant, availabilityDegraded));
                }}
                className="size-4"
              />
              <span>{variant.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p className="text-lg text-(--nb-text)">
        <Price amount={cents(selected.priceCents)} />
      </p>
      <AvailabilityNotice availability={selected.availability} degraded={availabilityDegraded} />
      <LiveRegion message={message} />
      <AddToCartSlot
        variantId={selected.id}
        disabledReason={disabledReason(selected, availabilityDegraded)}
      />
    </div>
  );
}
