"use client";

import type { ReactNode } from "react";
import { trackEvent } from "../_actions/track";

/**
 * Wraps related-product links. A click on a link to a known product fires a beacon through a
 * server action without awaiting it, so navigation never waits on analytics.
 */
export function RelationshipBeacon({
  fromProductId,
  productIdsBySlug,
  children,
}: {
  fromProductId: string;
  productIdsBySlug: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <div
      onClickCapture={(e) => {
        const anchor = (e.target as Element).closest?.("a[href]");
        const match = anchor?.getAttribute("href")?.match(/^\/products\/([^/?#]+)/);
        const toProductId = match ? productIdsBySlug[match[1]!] : undefined;
        if (!toProductId) return;
        trackEvent("product_relationship_clicked", { fromProductId, toProductId }).catch(() => {});
      }}
    >
      {children}
    </div>
  );
}
