import { Link } from "../primitives/Link";

export type PaginationProps = {
  /** Path without query string, e.g. "/shop". */
  basePath: string;
  page: number;
  pageCount: number;
  /** Other query params to keep (filters, sort, q). `page` is managed here. */
  params?: Readonly<Record<string, string | undefined>>;
};

function hrefFor(basePath: string, params: PaginationProps["params"], page: number): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value && key !== "page") search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Page numbers to show: first, last, and a window around the current page. */
function visiblePages(page: number, pageCount: number): (number | "gap")[] {
  const keep = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    const prev = sorted[i - 1];
    if (prev !== undefined && p - prev > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

const itemClass = "inline-flex min-h-11 min-w-11 items-center justify-center px-2";

export function Pagination({ basePath, page, pageCount, params }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination">
      <ul className="flex flex-wrap items-center gap-1">
        {page > 1 ? (
          <li>
            <Link
              href={hrefFor(basePath, params, page - 1)}
              rel="prev"
              aria-label="Previous page"
              className={itemClass}
            >
              Previous
            </Link>
          </li>
        ) : null}
        {visiblePages(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden="true" className={itemClass}>
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(basePath, params, p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={`${itemClass} ${p === page ? "font-semibold no-underline" : ""}`.trim()}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        {page < pageCount ? (
          <li>
            <Link
              href={hrefFor(basePath, params, page + 1)}
              rel="next"
              aria-label="Next page"
              className={itemClass}
            >
              Next
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
