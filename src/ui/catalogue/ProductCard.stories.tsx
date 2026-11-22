import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { product } from "./fixtures";
import { ProductCard, type ProductCardProps } from "./ProductCard";

const meta = {
  title: "Catalogue/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: { product },
} satisfies Meta<ProductCardProps>;
export default meta;
type Story = StoryObj<ProductCardProps>;

export const Default: Story = {};
export const Error: Story = { args: { availabilityDegraded: true } };
export const Disabled: Story = {
  args: { product: { ...product, availability: "OUT_OF_STOCK", hero: null } },
};
export const Focus: Story = { play: focusFirstControl };
