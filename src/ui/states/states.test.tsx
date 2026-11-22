// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../primitives/Button";
import { renderInTheme, themes } from "../test-utils";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { Skeleton } from "./Skeleton";

afterEach(cleanup);

const cases = {
  Skeleton: () => <Skeleton />,
  "Skeleton labelled": () => <Skeleton label="Loading bag" />,
  EmptyState: () => (
    <EmptyState
      title="Your bag is empty"
      description="Keep browsing"
      action={<Button>Shop</Button>}
    />
  ),
  ErrorState: () => (
    <ErrorState
      title="Something went wrong"
      description="Try again"
      action={<Button>Retry</Button>}
    />
  ),
};

describe.each(themes)("axe in %s theme", (theme) => {
  it.each(Object.entries(cases))("%s has no violations", async (_name, Case) => {
    const { violations } = await renderInTheme(<Case />, theme);
    expect(violations).toEqual([]);
  });
});

describe("states", () => {
  it("Skeleton is hidden from assistive tech unless labelled", () => {
    const { container, rerender } = render(<Skeleton />);
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    rerender(<Skeleton label="Loading bag" />);
    expect(screen.getByRole("status").textContent).toBe("Loading bag");
  });

  it("ErrorState is an alert with a heading and icon; EmptyState is not an alert", () => {
    render(<ErrorState title="Oops" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Oops" })).toBeTruthy();
    cleanup();
    render(<EmptyState title="Nothing" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("state actions are keyboard focusable and activatable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<ErrorState title="Oops" action={<Button onClick={onClick}>Retry</Button>} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Retry" })).toBe(document.activeElement);
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
