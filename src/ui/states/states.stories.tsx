import { Button } from "../primitives/Button";
import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";

type Props = { title: string; description?: string };
function Showcase({ title, description }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton label="Loading your bag" className="h-6 w-1/2" />
      <EmptyState title={title} description={description} action={<Button>Keep browsing</Button>} />
      <ErrorState
        title="Something went wrong"
        description="Please try again."
        action={<Button variant="secondary">Try again</Button>}
      />
    </div>
  );
}

const meta = {
  title: "States/Skeleton, EmptyState, ErrorState",
  component: Showcase,
  tags: ["autodocs"],
  args: { title: "Your bag is empty" },
} satisfies Meta<Props>;
export default meta;
type Story = StoryObj<Props>;

export const Default: Story = {};
export const Error: Story = {
  args: { title: "Nothing found", description: "Try a different search." },
};
export const Disabled: Story = {
  render: () => <Skeleton label="Loading" className="h-24 w-full" />,
};
export const Focus: Story = { play: focusFirstControl };
