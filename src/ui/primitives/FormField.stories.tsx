import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { FormField, type FormFieldProps } from "./FormField";
import { controlClass } from "./FormField";

const meta = {
  title: "Primitives/FormField",
  component: FormField,
  tags: ["autodocs"],
  args: {
    label: "Email for order updates",
    hint: "We only use this for your order",
    children: (control) => <input type="email" className={controlClass} {...control} />,
  },
} satisfies Meta<FormFieldProps>;
export default meta;
type Story = StoryObj<FormFieldProps>;

export const Default: Story = {};
export const Error: Story = { args: { error: "Enter a valid email address" } };
export const Disabled: Story = {
  args: {
    children: (control) => <input type="email" disabled className={controlClass} {...control} />,
  },
};
export const Focus: Story = { play: focusFirstControl };
