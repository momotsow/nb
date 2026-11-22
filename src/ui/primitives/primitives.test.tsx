// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cents } from "@/domain/money/money";
import { renderInTheme, themes } from "../test-utils";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { FormField } from "./FormField";
import { Link } from "./Link";
import { LiveRegion } from "./LiveRegion";
import { Notice } from "./Notice";
import { Price } from "./Price";
import { Select } from "./Select";
import { TextField } from "./TextField";
import { VisuallyHidden } from "./VisuallyHidden";

afterEach(cleanup);

const cases = {
  Button: () => <Button>Add to bag</Button>,
  "Button disabled": () => <Button disabled>Add to bag</Button>,
  Link: () => <Link href="/">Home</Link>,
  TextField: () => <TextField label="Name" hint="As on your ID" />,
  "TextField error": () => <TextField label="Name" error="Enter a name" required />,
  "TextField disabled": () => <TextField label="Name" disabled />,
  Select: () => (
    <Select label="Province" error="Choose one">
      <option value="">Choose</option>
      <option value="gp">Gauteng</option>
    </Select>
  ),
  Checkbox: () => <Checkbox label="Gift" hint="We will hide prices" />,
  "Checkbox error": () => <Checkbox label="Terms" required error="Accept the terms" />,
  FormField: () => (
    <FormField label="Email" hint="Order updates only" error="Invalid email">
      {(control) => <input type="email" {...control} />}
    </FormField>
  ),
  VisuallyHidden: () => (
    <button type="button">
      <VisuallyHidden>Close</VisuallyHidden>
    </button>
  ),
  LiveRegion: () => <LiveRegion message="Added to bag" />,
  "Notice info": () => <Notice>Free shipping over R 600.</Notice>,
  "Notice error": () => <Notice tone="error">Could not save.</Notice>,
  Price: () => <Price amount={cents(123450)} />,
};

describe.each(themes)("axe in %s theme", (theme) => {
  it.each(Object.entries(cases))("%s has no violations", async (_name, Case) => {
    const { violations } = await renderInTheme(<Case />, theme);
    expect(violations).toEqual([]);
  });
});

describe("semantics", () => {
  it("FormField associates label, hint and error with the control", () => {
    render(<TextField label="Name" hint="As on your ID" error="Enter a name" required />);
    const input = screen.getByLabelText(/Name/);
    expect(input).toHaveProperty("required", true);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const described = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(described).toHaveLength(2);
    const text = described.map((id) => document.getElementById(id)?.textContent).join(" ");
    expect(text).toContain("As on your ID");
    expect(text).toContain("Enter a name");
  });

  it("omits aria-invalid and aria-describedby when there is no hint or error", () => {
    render(<TextField label="Name" />);
    const input = screen.getByLabelText("Name");
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.hasAttribute("aria-describedby")).toBe(false);
  });

  it("Price renders <data value> from integer cents", () => {
    const { container } = render(<Price amount={cents(123405)} />);
    const el = container.querySelector("data");
    expect(el?.getAttribute("value")).toBe("1234.05");
    expect(el?.textContent).toMatch(/1\D?234,05/);
  });

  it("Notice uses status for info and alert for error, with text and an icon", () => {
    render(
      <>
        <Notice>Info text</Notice>
        <Notice tone="error">Error text</Notice>
      </>,
    );
    const status = screen.getByRole("status");
    const alert = screen.getByRole("alert");
    expect(status.textContent).toContain("Info text");
    expect(alert.textContent).toContain("Error text");
    expect(alert.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });

  it("controls meet the 44px touch target class", () => {
    render(
      <>
        <Button>Go</Button>
        <TextField label="Name" />
      </>,
    );
    expect(screen.getByRole("button").className).toContain("min-h-11");
    expect(screen.getByLabelText("Name").className).toContain("min-h-11");
  });

  it("LiveRegion exposes a polite status region", () => {
    render(<LiveRegion message="Added" />);
    expect(screen.getByRole("status").getAttribute("aria-live")).toBe("polite");
  });
});

describe("keyboard", () => {
  it("Tab reaches controls in order and skips disabled ones", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Button>First</Button>
        <Button disabled>Skipped</Button>
        <Link href="/">Link</Link>
        <TextField label="Name" />
        <Select label="Province">
          <option>One</option>
        </Select>
        <Checkbox label="Gift" />
      </>,
    );
    await user.tab();
    expect(screen.getByRole("button", { name: "First" })).toBe(document.activeElement);
    await user.tab();
    expect(screen.getByRole("link")).toBe(document.activeElement);
    await user.tab();
    expect(screen.getByLabelText("Name")).toBe(document.activeElement);
    await user.tab();
    expect(screen.getByLabelText("Province")).toBe(document.activeElement);
    await user.tab();
    expect(screen.getByLabelText("Gift")).toBe(document.activeElement);
  });

  it("Button activates with Enter and Space but not when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onDisabled = vi.fn();
    render(
      <>
        <Button onClick={onClick}>Go</Button>
        <Button disabled onClick={onDisabled}>
          Off
        </Button>
      </>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
    await user.click(screen.getByRole("button", { name: "Off" }));
    expect(onDisabled).not.toHaveBeenCalled();
  });

  it("Checkbox toggles with Space", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Gift" />);
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByLabelText("Gift")).toHaveProperty("checked", true);
  });

  it("Select changes value with the keyboard", async () => {
    const user = userEvent.setup();
    render(
      <Select label="Province">
        <option value="gp">Gauteng</option>
        <option value="wc">Western Cape</option>
      </Select>,
    );
    await user.tab();
    expect(screen.getByLabelText("Province")).toBe(document.activeElement);
    // jsdom does not implement native arrow-key selection; select via the user API.
    await user.selectOptions(screen.getByLabelText("Province"), "wc");
    expect((screen.getByLabelText("Province") as HTMLSelectElement).value).toBe("wc");
  });

  it("Link activates with Enter", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault());
    render(
      <Link href="/x" onClick={onClick}>
        Go
      </Link>,
    );
    await user.tab();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
