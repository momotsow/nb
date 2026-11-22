export type SafeContext = Readonly<Record<string, string | number>>;

export type ScrubbedReport = {
  name: string;
  message: string;
  context: Record<string, string | number>;
};

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
// 9+ digits, optionally with +, spaces, dashes, dots, parentheses.
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const SENSITIVE_KEY = /cookie|authorization|header|body|payload|password|token|secret|email|phone/i;

export function scrubString(value: string): string {
  return value.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
}

export function scrubContext(ctx: unknown): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (typeof ctx !== "object" || ctx === null) return out;
  for (const [key, value] of Object.entries(ctx)) {
    if (SENSITIVE_KEY.test(key)) continue;
    if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "string") out[key] = scrubString(value);
    // Objects, arrays and other types are dropped: only strings/numbers are safe.
  }
  return out;
}

/** Reduces any thrown value to a name, scrubbed message and safe context. Stack, headers, cookies and bodies are never included. */
export function scrub(err: unknown, ctx?: SafeContext): ScrubbedReport {
  const isError = err instanceof Error;
  const message = isError ? err.message : typeof err === "string" ? err : "Non-error value thrown";
  return {
    name: isError ? err.name : "NonError",
    message: scrubString(message),
    context: scrubContext(ctx),
  };
}
