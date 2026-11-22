// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderInTheme, themes } from "../test-utils";
import { AddToCartSlot } from "./AddToCartSlot";
import { AvailabilityNotice } from "./AvailabilityNotice";
import { Filters } from "./Filters";
import { images, product, variants } from "./fixtures";
import { Pagination } from "./Pagination";
import { ProductCard } from "./ProductCard";
import { ProductGallery } from "./ProductGallery";
import { VariantSelector } from "./VariantSelector";

afterEach(cleanup);

const filterProps = {
  action: "/shop",
  categories: [{ slug: "candles", name: "Candles" }],
  collections: [{ slug: "sample", name: "Sample" }],
};

const cases = {
  ProductCard: () => <ProductCard product={product} />,
  "ProductCard no image": () => <ProductCard product={{ ...product, hero: null }} />,
  ProductGallery: () => <ProductGallery images={images} productName="Sample candle" />,
  "ProductGallery empty": () => <ProductGallery images={[]} productName="Sample candle" />,
  VariantSelector: () => <VariantSelector variants={variants} defaultVariantId="v1" />,
  "VariantSelector degraded": () => (
    <VariantSelector variants={variants} defaultVariantId="v2" availabilityDegraded />
  ),
  Filters: () => <Filters {...filterProps} />,
  Pagination: () => <Pagination basePath="/shop" page={3} pageCount={9} />,
  AddToCartSlot: () => <AddToCartSlot variantId="v1" disabledReason="Not available yet." />,
  AvailabilityNotice: () => <AvailabilityNotice availability="LOW_STOCK" />,
};

describe.each(themes)("axe in %s theme", (theme) => {
  it.each(Object.entries(cases))("%s has no violations", async (_name, Case) => {
    const { violations } = await renderInTheme(<Case />, theme);
    expect(violations).toEqual([]);
  });
});

describe("ProductCard", () => {
  it("links to the product, shows From price for ranges and uses catalogue alt text", () => {
    render(<ProductCard product={product} />);
    expect(screen.getByRole("link", { name: "Sample candle" }).getAttribute("href")).toBe(
      "/products/seed-sample-candle",
    );
    expect(screen.getByText("From")).toBeTruthy();
    const img = screen.getByRole("img", { name: "Sample product view 1" });
    expect(img.getAttribute("width")).toBe("800");
    expect(img.getAttribute("height")).toBe("800");
    expect(img.getAttribute("loading")).toBe("lazy");
  });

  it("loads eagerly when marked as priority", () => {
    render(<ProductCard product={product} priority />);
    expect(screen.getByRole("img").getAttribute("loading")).toBe("eager");
  });
});

describe("ProductGallery", () => {
  it("loads the first image eagerly and later images lazily", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={images} productName="Sample candle" />);
    expect(screen.getByRole("img", { name: images[0]!.alt }).getAttribute("loading")).toBe("eager");
    await user.click(screen.getByRole("button", { name: /Show image 2 of 3/ }));
    expect(screen.getByRole("img", { name: images[1]!.alt }).getAttribute("loading")).toBe("lazy");
  });

  it("thumbnails are buttons operable by keyboard and mark the current image", async () => {
    const user = userEvent.setup();
    render(<ProductGallery images={images} productName="Sample candle" />);
    const [first, second] = screen.getAllByRole("button");
    expect(first!.getAttribute("aria-current")).toBe("true");
    expect(second!.getAttribute("aria-current")).toBeNull();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(second);
    await user.keyboard("{Enter}");
    expect(second!.getAttribute("aria-current")).toBe("true");
    expect(first!.getAttribute("aria-current")).toBeNull();
    await user.keyboard(" ");
    expect(second!.getAttribute("aria-current")).toBe("true");
  });
});

describe("VariantSelector", () => {
  it("is a named radio group and the selected variant drives price and availability", async () => {
    const user = userEvent.setup();
    render(<VariantSelector variants={variants} defaultVariantId="v1" />);
    const group = screen.getByRole("group", { name: "Choose an option" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect((screen.getByRole("radio", { name: "Small" }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getAllByText("In stock").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("radio", { name: "Large" }));
    expect(screen.getAllByText("Out of stock").length).toBeGreaterThan(0);
    expect(screen.getByText("This option is out of stock.")).toBeTruthy();
    expect(document.querySelector("data")?.getAttribute("value")).toBe("275.00");
  });

  it("announces the new selection through the live region", async () => {
    const user = userEvent.setup();
    render(<VariantSelector variants={variants} defaultVariantId="v1" />);
    const region = screen.getByRole("status");
    expect(region.textContent).toBe("");
    await user.click(screen.getByRole("radio", { name: "Medium" }));
    await waitFor(() => expect(region.textContent).toMatch(/Medium.*Low stock/));
  });

  it("arrow keys move between options", async () => {
    const user = userEvent.setup();
    render(<VariantSelector variants={variants} defaultVariantId="v1" />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "Small" }));
    await user.keyboard("{ArrowDown}");
    expect((screen.getByRole("radio", { name: "Medium" }) as HTMLInputElement).checked).toBe(true);
  });

  it("shows the degraded message and keeps add to cart disabled", () => {
    render(<VariantSelector variants={variants} defaultVariantId="v1" availabilityDegraded />);
    expect(screen.getAllByText(/temporarily unavailable/).length).toBeGreaterThan(0);
    expect(
      (screen.getByRole("button", { name: "Add to cart" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe("AddToCartSlot", () => {
  it("is a disabled button described by its explanation", () => {
    render(<AddToCartSlot variantId="v1" disabledReason="Not available yet." />);
    const button = screen.getByRole("button", { name: "Add to cart" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe(screen.getByText("Not available yet.").id);
  });
});

describe("Filters", () => {
  it("is a plain GET form that submits named fields without JavaScript", () => {
    render(<Filters {...filterProps} values={{ category: "candles", sort: "price_asc" }} />);
    const form = screen.getByRole("form", { name: "Filter and sort products" });
    expect(form.getAttribute("method")).toBe("get");
    expect(form.getAttribute("action")).toBe("/shop");
    expect((screen.getByLabelText("Category") as HTMLSelectElement).value).toBe("candles");
    expect((screen.getByLabelText("Sort by") as HTMLSelectElement).value).toBe("price_asc");
    expect(screen.getByLabelText("Collection").getAttribute("name")).toBe("collection");
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).type).toBe(
      "submit",
    );
  });

  it("is keyboard operable: tab through fields to the submit button", async () => {
    const user = userEvent.setup();
    render(<Filters {...filterProps} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByLabelText("Category"));
    await user.tab();
    await user.tab();
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Apply" }));
  });
});

describe("Pagination", () => {
  it("marks the current page and exposes prev/next rel", () => {
    render(<Pagination basePath="/shop" page={3} pageCount={9} params={{ sort: "price_asc" }} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Page 3" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Page 2" }).getAttribute("aria-current")).toBeNull();
    const prev = screen.getByRole("link", { name: "Previous page" });
    const next = screen.getByRole("link", { name: "Next page" });
    expect(prev.getAttribute("rel")).toBe("prev");
    expect(next.getAttribute("rel")).toBe("next");
    expect(prev.getAttribute("href")).toBe("/shop?sort=price_asc&page=2");
    expect(next.getAttribute("href")).toBe("/shop?sort=price_asc&page=4");
    expect(screen.getByRole("link", { name: "Page 1" }).getAttribute("href")).toBe(
      "/shop?sort=price_asc",
    );
  });

  it("renders nothing for a single page and omits prev on the first page", () => {
    const { container, rerender } = render(<Pagination basePath="/shop" page={1} pageCount={1} />);
    expect(container.innerHTML).toBe("");
    rerender(<Pagination basePath="/shop" page={1} pageCount={3} />);
    expect(screen.queryByRole("link", { name: "Previous page" })).toBeNull();
  });

  it("links are reachable by keyboard", async () => {
    const user = userEvent.setup();
    render(<Pagination basePath="/shop" page={2} pageCount={3} />);
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("link", { name: "Previous page" }));
  });
});

describe("AvailabilityNotice", () => {
  it("uses text plus a decorative icon for each state", () => {
    const { container } = render(<AvailabilityNotice availability="OUT_OF_STOCK" />);
    expect(screen.getByText("Out of stock")).toBeTruthy();
    expect(container.querySelector("svg[aria-hidden='true']")).not.toBeNull();
  });
});
