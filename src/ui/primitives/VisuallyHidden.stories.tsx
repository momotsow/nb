import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Button } from "./Button";
import { VisuallyHidden } from "./VisuallyHidden";

type Props = { text: string };
function Demo({ text }: Props) {
  return (
    <Button variant="secondary">
      <span aria-hidden="true">+</span>
      <VisuallyHidden>{text}</VisuallyHidden>
    </Button>
  );
}

const meta = {
  title: "Primitives/VisuallyHidden",
  component: Demo,
  tags: ["autodocs"],
  args: { text: "Add one more" },
} satisfies Meta<Props>;
export default meta;
type Story = StoryObj<Props>;

export const Default: Story = {};
export const Error: Story = { args: { text: "Error: quantity unavailable" } };
export const Disabled: Story = {
  render: () => (
    <Button disabled>
      <VisuallyHidden>Unavailable</VisuallyHidden>-
    </Button>
  ),
};
export const Focus: Story = { play: focusFirstControl };
