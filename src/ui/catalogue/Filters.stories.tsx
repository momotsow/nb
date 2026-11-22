import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Filters, type FiltersProps } from "./Filters";

const meta = {
  title: "Catalogue/Filters",
  component: Filters,
  tags: ["autodocs"],
  args: {
    action: "/shop",
    categories: [
      { slug: "candles", name: "Candles" },
      { slug: "diffusers", name: "Diffusers" },
    ],
    collections: [{ slug: "seed-collection", name: "Sample collection" }],
  },
} satisfies Meta<FiltersProps>;
export default meta;
type Story = StoryObj<FiltersProps>;

export const Default: Story = {};
// Filters are a plain form: error and disabled show the sort-only rendering and a preselected state.
export const Error: Story = { args: { categories: [], collections: [] } };
export const Disabled: Story = { args: { values: { category: "candles", sort: "price_asc" } } };
export const Focus: Story = { play: focusFirstControl };
