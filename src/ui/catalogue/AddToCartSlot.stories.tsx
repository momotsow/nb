import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { AddToCartSlot, type AddToCartSlotProps } from "./AddToCartSlot";

const meta = {
  title: "Catalogue/AddToCartSlot",
  component: AddToCartSlot,
  tags: ["autodocs"],
  args: { variantId: "v1", disabledReason: "Adding to cart is not available yet." },
} satisfies Meta<AddToCartSlotProps>;
export default meta;
type Story = StoryObj<AddToCartSlotProps>;

export const Default: Story = {};
export const Error: Story = {
  args: { disabledReason: "Availability is temporarily unavailable." },
};
export const Disabled: Story = { args: { disabledReason: "This option is out of stock." } };
// The button is disabled, so there is nothing to focus; the story documents that.
export const Focus: Story = { play: focusFirstControl };
