import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "./env";

const valid = { DATABASE_URL: "postgresql://user:pass@localhost:5432/db" };

describe("parseServerEnv", () => {
  it("accepts minimal valid env and applies defaults", () => {
    const env = parseServerEnv(valid);
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.AI_PROVIDER).toBe("none");
  });

  it("treats blank optional values as unset", () => {
    const env = parseServerEnv({ ...valid, AUTH_SECRET: "", RESEND_API_KEY: "", AI_PROVIDER: "" });
    expect(env.AUTH_SECRET).toBeUndefined();
    expect(env.RESEND_API_KEY).toBeUndefined();
    expect(env.AI_PROVIDER).toBe("none");
  });

  it("fails fast when DATABASE_URL is missing or malformed", () => {
    expect(() => parseServerEnv({})).toThrow();
    expect(() => parseServerEnv({ DATABASE_URL: "not a url" })).toThrow();
  });

  it("rejects invalid values for set optional variables", () => {
    expect(() => parseServerEnv({ ...valid, AUTH_SECRET: "short" })).toThrow();
    expect(() => parseServerEnv({ ...valid, AI_PROVIDER: "bogus" })).toThrow();
    expect(() => parseServerEnv({ ...valid, APP_URL: "nope" })).toThrow();
  });

  it("drops Bobpay and PAYMENT_PROVIDER keys", () => {
    const env = parseServerEnv({ ...valid, PAYMENT_PROVIDER: "bobpay", BOBPAY_API_KEY: "x" });
    expect(env).not.toHaveProperty("PAYMENT_PROVIDER");
    expect(env).not.toHaveProperty("BOBPAY_API_KEY");
  });

  it("does not expose public variables", () => {
    expect(parseServerEnv({ ...valid, NEXT_PUBLIC_POSTHOG_KEY: "k" })).not.toHaveProperty(
      "NEXT_PUBLIC_POSTHOG_KEY",
    );
  });
});

describe("parsePublicEnv", () => {
  it("allows the key to be unset or blank", () => {
    expect(parsePublicEnv({}).NEXT_PUBLIC_POSTHOG_KEY).toBeUndefined();
    expect(parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "" }).NEXT_PUBLIC_POSTHOG_KEY).toBeUndefined();
  });

  it("exposes only NEXT_PUBLIC_* values", () => {
    const env = parsePublicEnv({ NEXT_PUBLIC_POSTHOG_KEY: "k", DATABASE_URL: "secret" });
    expect(env).toEqual({ NEXT_PUBLIC_POSTHOG_KEY: "k" });
  });
});
