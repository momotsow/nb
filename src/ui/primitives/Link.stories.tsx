import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Link, type LinkProps } from "./Link";

const meta = {
  title: "Primitives/Link",
  component: Link,
  tags: ["autodocs"],
  args: { href: "/", children: "Back to home" },
} satisfies Meta<LinkProps>;
export default meta;
type Story = StoryObj<LinkProps>;

export const Default: Story = {};
export const Standalone: Story = { args: { display: "standalone" } };
// Links have no intrinsic error or disabled state; these stories show the equivalent
// unavailable/error wording and use aria-disabled with no navigation.
export const Error: Story = { args: { href: "/", children: "Something went wrong, return home" } };
export const Disabled: Story = {
  args: { href: "/", "aria-disabled": true, tabIndex: -1, children: "Unavailable" },
};
export const Focus: Story = { play: focusFirstControl };
