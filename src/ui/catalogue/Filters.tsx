import { Button } from "../primitives/Button";
import { Link } from "../primitives/Link";
import { Select } from "../primitives/Select";

export type FilterOption = { slug: string; name: string };

export type FiltersProps = {
  /** Where the GET form submits, e.g. "/shop". */
  action: string;
  categories?: readonly FilterOption[];
  collections?: readonly FilterOption[];
  values?: { category?: string; collection?: string; sort?: string };
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const;

/**
 * Plain GET form so filtering works without JavaScript. Submitting drops `page`, so results
 * restart at page 1.
 */
export function Filters({ action, categories = [], collections = [], values = {} }: FiltersProps) {
  return (
    <form
      method="get"
      action={action}
      aria-label="Filter and sort products"
      className="grid gap-4 sm:grid-cols-3"
    >
      {categories.length > 0 ? (
        <Select label="Category" name="category" defaultValue={values.category ?? ""}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      ) : null}
      {collections.length > 0 ? (
        <Select label="Collection" name="collection" defaultValue={values.collection ?? ""}>
          <option value="">All collections</option>
          {collections.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </Select>
      ) : null}
      <Select label="Sort by" name="sort" defaultValue={values.sort ?? "featured"}>
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
      <div className="flex items-center gap-4 sm:col-span-3">
        <Button type="submit">Apply</Button>
        <Link href={action} display="standalone">
          Clear filters
        </Link>
      </div>
    </form>
  );
}
