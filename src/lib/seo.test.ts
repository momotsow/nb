import { describe, expect, it } from "vitest";
import {
  buildPageMetadata,
  buildRobots,
  buildSitemap,
  canonicalUrl,
  pagedTitle,
  ROBOTS_DISALLOW,
  serialiseJsonLd,
  toSnippet,
} from "./seo";

describe("robots", () => {
  it("disallows the initial paths and points at the sitemap", () => {
    const r = buildRobots(undefined, "https://example.test");
    expect(ROBOTS_DISALLOW).toEqual(expect.arrayContaining(["/search", "/cart", "/checkout"]));
    expect(r.rules).toEqual([{ userAgent: "*", allow: "/", disallow: [...ROBOTS_DISALLOW] }]);
    expect(r.sitemap).toBe("https://example.test/sitemap.xml");
  });

  it("accepts an extended disallow list", () => {
    const r = buildRobots([...ROBOTS_DISALLOW, "/account"], "https://example.test");
    expect(JSON.stringify(r.rules)).toContain("/account");
  });
});

describe("sitemap", () => {
  it("contains only the homepage when no sources are registered", async () => {
    expect(await buildSitemap([], "https://example.test")).toEqual([
      { url: "https://example.test/", changeFrequency: "weekly", priority: 1 },
    ]);
  });

  it("composes sync and async sources", async () => {
    const entries = await buildSitemap(
      [() => [{ url: "https://example.test/a" }], async () => [{ url: "https://example.test/b" }]],
      "https://example.test",
    );
    expect(entries.map((e) => e.url)).toEqual([
      "https://example.test/",
      "https://example.test/a",
      "https://example.test/b",
    ]);
  });
});

describe("canonicalUrl", () => {
  const base = "https://example.test";
  it("is origin plus path, with no filters", () => {
    expect(canonicalUrl("/shop", { base })).toBe("https://example.test/shop");
  });
  it("keeps page only beyond the first page", () => {
    expect(canonicalUrl("/shop", { base, page: 1 })).toBe("https://example.test/shop");
    expect(canonicalUrl("/shop", { base, page: 3 })).toBe("https://example.test/shop?page=3");
  });
});

describe("page metadata", () => {
  it("marks noindex pages and falls back to a summary card without an image", () => {
    const m = buildPageMetadata({
      title: "Search",
      description: "d",
      path: "/search",
      noindex: true,
    });
    expect(m.robots).toEqual({ index: false, follow: true });
    expect(m.twitter).toMatchObject({ card: "summary" });
  });

  it("uses a large image card and carries the image into Open Graph", () => {
    const m = buildPageMetadata({
      title: "T",
      description: "d",
      path: "/products/x",
      image: { url: "/img.png", alt: "alt" },
    });
    expect(m.twitter).toMatchObject({ card: "summary_large_image" });
    expect(m.openGraph).toMatchObject({ images: [{ url: "/img.png", alt: "alt" }] });
    expect(m.robots).toBeUndefined();
  });

  it("makes paged titles unique and snippets short", () => {
    expect(pagedTitle("Shop", 1)).toBe("Shop");
    expect(pagedTitle("Shop", 2)).toBe("Shop (page 2)");
    expect(toSnippet("a  b\n c")).toBe("a b c");
    expect(toSnippet("x".repeat(300))).toHaveLength(160);
  });
});

describe("serialiseJsonLd", () => {
  it("escapes < so a value cannot close the script element", () => {
    const out = serialiseJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(out).toContain("\\u003c/script>");
    expect(JSON.parse(out)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});
