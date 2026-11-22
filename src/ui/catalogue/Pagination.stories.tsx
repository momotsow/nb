import { focusFirstControl, type Meta, type StoryObj } from "../story-types";
import { Pagination, type PaginationProps } from "./Pagination";

const meta = {
  title: "Catalogue/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: { basePath: "/shop", page: 3, pageCount: 9, params: { sort: "price_asc" } },
} satisfies Meta<PaginationProps>;
export default meta;
type Story = StoryObj<PaginationProps>;

export const Default: Story = {};
// Pagination renders nothing for a single page; show the first-page rendering for error/disabled.
export const Error: Story = { args: { page: 1, pageCount: 1 } };
export const Disabled: Story = { args: { page: 1 } };
export const Focus: Story = { play: focusFirstControl };
