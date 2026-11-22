"use client";

import { useState } from "react";
import type { MediaView } from "./types";

export type ProductGalleryProps = {
  images: readonly MediaView[];
  /** Used in the group label, e.g. "Linen candle images". */
  productName: string;
};

/**
 * First image loads eagerly (LCP); later images load lazily. Thumbnails are buttons with
 * aria-current. Width and height are always set so the layout does not shift.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const current = images[index];

  if (!current) {
    return <div aria-hidden="true" className="aspect-square rounded-xl bg-(--nb-surface)" />;
  }

  return (
    <section aria-label={`${productName} images`} className="flex flex-col gap-3">
      <div className="aspect-square overflow-hidden rounded-xl bg-(--nb-surface)">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.mediaRef}
          src={current.mediaRef}
          alt={current.alt}
          width={current.width}
          height={current.height}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="size-full object-cover"
        />
      </div>
      {images.length > 1 ? (
        <ul className="flex flex-wrap gap-2">
          {images.map((image, i) => (
            <li key={`${image.mediaRef}-${i}`}>
              <button
                type="button"
                aria-label={`Show image ${i + 1} of ${images.length}: ${image.alt}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => setIndex(i)}
                className="size-16 min-h-11 min-w-11 overflow-hidden rounded-lg border border-(--nb-border) bg-(--nb-surface) aria-[current=true]:border-2 aria-[current=true]:border-(--nb-text)"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.mediaRef}
                  alt=""
                  width={64}
                  height={64}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
