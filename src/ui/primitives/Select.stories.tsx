import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Select, type SelectProps } from "./Select";

const options = (
  <>
    <option value="">Choose a province</option>
    <option value="gp">Gauteng</option>
    <option value="wc">Western Cape</option>
  </>
);
const meta = {
  title: "Primitives/Select",
  component: Select,
  tags: ["autodocs"],
  args: { label: "Province", children: options },
} satisfies Meta<SelectProps>;
export default meta;
type Story = StoryObj<SelectProps>;

export const Default: Story = {};
export const Error: Story = { args: { error: "Choose a province" } };
export const Disabled: Story = { args: { disabled: true } };
export const Focus: Story = { play: focusFirstControl };
