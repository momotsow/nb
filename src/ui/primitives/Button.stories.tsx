import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Button, type ButtonProps } from "./Button";

const meta = {
  title: "Primitives/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Add to bag" },
} satisfies Meta<ButtonProps>;
export default meta;
type Story = StoryObj<ButtonProps>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
// Buttons have no error state; the destructive/failed outcome is shown with a Notice. Disabled covers the unavailable case.
export const Error: Story = { args: { children: "Retry payment" } };
export const Disabled: Story = { args: { disabled: true } };
export const Focus: Story = { play: focusFirstControl };
