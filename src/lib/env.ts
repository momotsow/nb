import { z } from "zod";

// Validated, typed environment. Fails fast on misconfiguration.
// Variables for undecided vendors (payments, courier, auth, email, AI) are
// optional and unused until their spec lands.

// Blank values (e.g. `KEY=` in .env) count as unset.
const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);
const optional = <T extends z.ZodType>(s: T) => z.preprocess(blankToUndefined, s.optional());

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_URL: z.preprocess(blankToUndefined, z.string().url().default("http://localhost:3000")),
  AUTH_SECRET: optional(z.string().min(32)),
  RESEND_API_KEY: optional(z.string()),
  CLOUDINARY_URL: optional(z.string()),
  SENTRY_DSN: optional(z.string()),
  AI_PROVIDER: z.preprocess(
    blankToUndefined,
    z.enum(["openai", "anthropic", "none"]).default("none"),
  ),
  AI_API_KEY: optional(z.string()),
});

const publicSchema = z.object({
  NEXT_PUBLIC_POSTHOG_KEY: optional(z.string()),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type PublicEnv = z.infer<typeof publicSchema>;

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  return serverSchema.parse(source);
}

export function parsePublicEnv(source: Record<string, string | undefined>): PublicEnv {
  return publicSchema.parse(source);
}

let serverCached: ServerEnv | undefined;
/** Server-only. Throws if called from a browser bundle. */
export function serverEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("serverEnv() must not be called from client code");
  }
  serverCached ??= parseServerEnv(process.env);
  return serverCached;
}

let publicCached: PublicEnv | undefined;
/** Safe for client code: exposes NEXT_PUBLIC_* only. */
export function publicEnv(): PublicEnv {
  // Literal property access so Next.js can inline values into client bundles.
  publicCached ??= parsePublicEnv({
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  });
  return publicCached;
}
