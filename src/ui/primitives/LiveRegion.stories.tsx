import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Button } from "./Button";
import { LiveRegion, useAnnouncer, type LiveRegionProps } from "./LiveRegion";

function Demo({ message, politeness }: LiveRegionProps) {
  const [live, announce] = useAnnouncer();
  return (
    <div>
      <Button onClick={() => announce(message || "Item added to bag")}>Announce</Button>
      <LiveRegion message={live} politeness={politeness} />
    </div>
  );
}

const meta = {
  title: "Primitives/LiveRegion",
  component: Demo,
  tags: ["autodocs"],
  args: { message: "Item added to bag" },
} satisfies Meta<LiveRegionProps>;
export default meta;
type Story = StoryObj<LiveRegionProps>;

export const Default: Story = {};
export const Error: Story = { args: { message: "Could not add item", politeness: "assertive" } };
export const Disabled: Story = { render: () => <Button disabled>Announce</Button> };
export const Focus: Story = { play: focusFirstControl };
