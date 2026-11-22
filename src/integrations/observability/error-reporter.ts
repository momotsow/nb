import { scrub, type SafeContext, type ScrubbedReport } from "./scrubber";

export type { SafeContext } from "./scrubber";

export interface ErrorReporter {
  capture(err: unknown, ctx?: SafeContext): void;
}

/** Adapters only ever receive scrubbed data. */
export interface ErrorReporterAdapter {
  send(report: ScrubbedReport): void;
}

export const noopAdapter: ErrorReporterAdapter = { send() {} };

export function createErrorReporter(adapter: ErrorReporterAdapter = noopAdapter): ErrorReporter {
  return {
    capture(err, ctx) {
      try {
        adapter.send(scrub(err, ctx));
      } catch {
        // Reporting must never throw into the caller.
      }
    },
  };
}
