import { describe, expect, it } from "vitest";
import { createErrorReporter } from "./error-reporter";
import type { ScrubbedReport } from "./scrubber";

function capture(err: unknown, ctx?: Record<string, unknown>): ScrubbedReport {
  let seen: ScrubbedReport | undefined;
  createErrorReporter({ send: (r) => (seen = r) }).capture(err, ctx as never);
  if (!seen) throw new Error("adapter not called");
  return seen;
}

describe("error reporter scrubbing", () => {
  it("removes emails and phone numbers from messages", () => {
    const r = capture(new Error("fail for jane.doe@example.com call +27 82 123 4567"));
    expect(r.message).not.toContain("@");
    expect(r.message).not.toMatch(/\d{3}/);
    expect(r.message).toContain("[email]");
    expect(r.message).toContain("[phone]");
  });

  it("scrubs string context values and keeps safe values", () => {
    const r = capture(new Error("x"), { step: "pay", code: 42, note: "a@b.co" });
    expect(r.context).toEqual({ step: "pay", code: 42, note: "[email]" });
  });

  it("drops cookies, headers, bodies and non-primitive values", () => {
    const r = capture(new Error("x"), {
      cookie: "session=abc",
      headers: { authorization: "Bearer t" },
      requestBody: '{"a":1}',
      body: { card: "4111" },
      nested: { a: 1 },
      step: "ok",
    });
    expect(r.context).toEqual({ step: "ok" });
  });

  it("never exposes stack or request data on the report", () => {
    const err = Object.assign(new Error("boom"), { request: { body: "secret" }, cookies: "c=1" });
    const r = capture(err);
    expect(JSON.stringify(r)).not.toMatch(/secret|c=1|stack/);
  });

  it("handles non-Error values and a throwing adapter", () => {
    expect(capture("plain").name).toBe("NonError");
    expect(() =>
      createErrorReporter({
        send: () => {
          throw new Error("adapter");
        },
      }).capture(new Error("x")),
    ).not.toThrow();
  });

  it("default reporter is a no-op", () => {
    expect(() => createErrorReporter().capture(new Error("x"))).not.toThrow();
  });
});
