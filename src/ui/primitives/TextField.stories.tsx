import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { TextField, type TextFieldProps } from "./TextField";

const meta = {
  title: "Primitives/TextField",
  component: TextField,
  tags: ["autodocs"],
  args: { label: "Delivery name", hint: "As it appears on your ID" },
} satisfies Meta<TextFieldProps>;
export default meta;
type Story = StoryObj<TextFieldProps>;

export const Default: Story = {};
export const Error: Story = { args: { error: "Enter a name", defaultValue: "" } };
export const Disabled: Story = { args: { disabled: true } };
export const Focus: Story = { play: focusFirstControl };
