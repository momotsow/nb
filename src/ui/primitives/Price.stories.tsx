import { cents } from "@/domain/money/money";
import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Link } from "./Link";
import { Price, type PriceProps } from "./Price";

type Props = PriceProps;
const meta = {
  title: "Primitives/Price",
  component: Price,
  tags: ["autodocs"],
  args: { amount: cents(123450) },
} satisfies Meta<Props>;
export default meta;
type Story = StoryObj<Props>;

export const Default: Story = {};
// Price is static text: error and disabled show the zero and in-context (unavailable) renderings.
export const Error: Story = { args: { amount: cents(0) } };
export const Disabled: Story = { args: { className: "line-through opacity-70" } };
export const Focus: Story = {
  render: (args) => (
    <Link href="/" display="standalone">
      Linen candle <Price {...args} />
    </Link>
  ),
  play: focusFirstControl,
};
