import { describe, expect, it } from "vitest";
import { createLocalMediaProvider } from "./local";

describe("local media provider", () => {
  it("maps a ref to a root-relative view with dimensions", () => {
    const view = createLocalMediaProvider().toView("brand/1.png", "Logo");
    expect(view).toEqual({ mediaRef: "/brand/1.png", alt: "Logo", width: 1200, height: 1200 });
  });

  it("does not double the leading slash", () => {
    expect(createLocalMediaProvider(400).toView("/a.png", "A").mediaRef).toBe("/a.png");
  });
});
