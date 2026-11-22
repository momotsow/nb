import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Link } from "./Link";
import { Notice, type NoticeProps } from "./Notice";

const meta = {
  title: "Primitives/Notice",
  component: Notice,
  tags: ["autodocs"],
  args: { children: "Orders over R 600 ship free." },
} satisfies Meta<NoticeProps>;
export default meta;
type Story = StoryObj<NoticeProps>;

export const Default: Story = {};
export const Success: Story = { args: { tone: "success", children: "Saved to your bag." } };
export const Error: Story = { args: { tone: "error", children: "We could not update your bag." } };
// Notices are not interactive; "disabled" is shown as a muted, non-actionable informational notice.
export const Disabled: Story = {
  args: { title: "Unavailable", children: "This item is out of stock." },
};
export const Focus: Story = {
  args: { children: <Link href="/">Review your bag</Link> },
  play: focusFirstControl,
};
