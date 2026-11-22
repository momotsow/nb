import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { AvailabilityNotice, type AvailabilityNoticeProps } from "./AvailabilityNotice";

const meta = {
  title: "Catalogue/AvailabilityNotice",
  component: AvailabilityNotice,
  tags: ["autodocs"],
  args: { availability: "IN_STOCK" },
} satisfies Meta<AvailabilityNoticeProps>;
export default meta;
type Story = StoryObj<AvailabilityNoticeProps>;

export const Default: Story = {};
export const Error: Story = { args: { availability: "OUT_OF_STOCK", degraded: true } };
export const Disabled: Story = { args: { availability: "OUT_OF_STOCK" } };
export const Focus: Story = { args: { availability: "LOW_STOCK" }, play: focusFirstControl };
