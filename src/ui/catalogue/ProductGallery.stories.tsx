import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { images } from "./fixtures";
import { ProductGallery, type ProductGalleryProps } from "./ProductGallery";

const meta = {
  title: "Catalogue/ProductGallery",
  component: ProductGallery,
  tags: ["autodocs"],
  args: { images, productName: "Sample candle" },
} satisfies Meta<ProductGalleryProps>;
export default meta;
type Story = StoryObj<ProductGalleryProps>;

export const Default: Story = {};
export const Error: Story = { args: { images: [] } };
export const Disabled: Story = { args: { images: images.slice(0, 1) } };
export const Focus: Story = { play: focusFirstControl };
