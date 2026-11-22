import { z } from "zod";
import type { ProductSort } from "./catalogue-service";

export const PAGE_SIZE = 24;
export const MAX_PAGE = 1000;
export const MAX_QUERY_LENGTH = 100;
export const MAX_SLUG_LENGTH = 100;

export const SORT_VALUES = ["featured", "price_asc", "price_desc", "newest"] as const;
export const DEFAULT_SORT: ProductSort = "featured";

export const slugSchema = z
  .string()
  .max(MAX_SLUG_LENGTH)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

const pageSchema = z.coerce.number().int().min(1).max(MAX_PAGE);
const sortSchema = z.enum(SORT_VALUES);

export type RawSearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

export interface ParsedListQuery {
  readonly page: number;
  readonly pageSize: number;
  readonly sort: ProductSort;
  readonly categorySlug?: string;
  readonly collectionSlug?: string;
}

export interface ListQueryParseResult {
  readonly query: ParsedListQuery;
  /** Filters whose slug was malformed. Routes should call notFound() when non-empty. */
  readonly invalidSlugs: readonly ("category" | "collection")[];
}

const first = (v: string | readonly string[] | undefined): string | undefined =>
  Array.isArray(v) ? (v[0] as string | undefined) : (v as string | undefined);

/** Returns the slug if well-formed, otherwise null (route should call notFound()). */
export function parseSlug(value: unknown): string | null {
  const r = slugSchema.safeParse(value);
  return r.success ? r.data : null;
}

/** Invalid page/sort fall back to defaults; invalid slugs are reported and dropped. */
export function parseListQuery(params: RawSearchParams): ListQueryParseResult {
  const page = pageSchema.safeParse(first(params.page));
  const sort = sortSchema.safeParse(first(params.sort));
  const invalidSlugs: ("category" | "collection")[] = [];

  const readSlug = (key: "category" | "collection"): string | undefined => {
    const raw = first(params[key]);
    if (raw === undefined || raw === "") return undefined;
    const slug = parseSlug(raw);
    if (slug === null) invalidSlugs.push(key);
    return slug ?? undefined;
  };

  const categorySlug = readSlug("category");
  const collectionSlug = readSlug("collection");

  return {
    query: {
      page: page.success ? page.data : 1,
      pageSize: PAGE_SIZE,
      sort: sort.success ? sort.data : DEFAULT_SORT,
      ...(categorySlug ? { categorySlug } : {}),
      ...(collectionSlug ? { collectionSlug } : {}),
    },
    invalidSlugs,
  };
}

export interface ParsedSearchQuery {
  /** Trimmed and capped at MAX_QUERY_LENGTH. Empty string means no search. */
  readonly q: string;
  readonly page: number;
}

export function parseSearchQuery(params: RawSearchParams): ParsedSearchQuery {
  const raw = first(params.q);
  const q = typeof raw === "string" ? raw.trim().slice(0, MAX_QUERY_LENGTH).trim() : "";
  const page = pageSchema.safeParse(first(params.page));
  return { q, page: page.success ? page.data : 1 };
}
