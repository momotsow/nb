import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { variants } from "./fixtures";
import { VariantSelector, type VariantSelectorProps } from "./VariantSelector";

const meta = {
  title: "Catalogue/VariantSelector",
  component: VariantSelector,
  tags: ["autodocs"],
  args: { variants, defaultVariantId: "v1" },
} satisfies Meta<VariantSelectorProps>;
export default meta;
type Story = StoryObj<VariantSelectorProps>;

export const Default: Story = {};
export const Error: Story = { args: { availabilityDegraded: true } };
export const Disabled: Story = { args: { defaultVariantId: "v3" } };
export const Focus: Story = { play: focusFirstControl };
