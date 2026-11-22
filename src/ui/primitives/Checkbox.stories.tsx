import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Checkbox, type CheckboxProps } from "./Checkbox";

const meta = {
  title: "Primitives/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "This order is a gift" },
} satisfies Meta<CheckboxProps>;
export default meta;
type Story = StoryObj<CheckboxProps>;

export const Default: Story = {};
export const Error: Story = {
  args: { label: "I accept the terms", required: true, error: "You must accept the terms" },
};
export const Disabled: Story = { args: { disabled: true } };
export const Focus: Story = { play: focusFirstControl };
