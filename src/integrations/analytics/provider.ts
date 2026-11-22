import type { z } from "zod";
import { ALLOWED_EVENTS, type EventRegistry } from "./events";

export type AnalyticsProps<R extends EventRegistry, E extends keyof R & string> = z.input<R[E]>;

export interface AnalyticsProvider<R extends EventRegistry = typeof ALLOWED_EVENTS> {
  track<E extends keyof R & string>(name: E, props: AnalyticsProps<R, E>): void;
}

/** Receives only validated events. */
export interface AnalyticsAdapter {
  send(name: string, props: Record<string, unknown>): void;
}

export type RejectionReason = "unknown_event" | "invalid_payload";

/** Rejections carry the event name and reason only, never payload values. */
export type RejectionReporter = (rejection: { name: string; reason: RejectionReason }) => void;

export const noopAdapter: AnalyticsAdapter = { send() {} };

export const consoleAdapter: AnalyticsAdapter = {
  send(name, props) {
    console.info("[analytics]", name, props);
  },
};

export const consoleRejectionReporter: RejectionReporter = (r) => {
  console.warn("[analytics] dropped event", r.name, r.reason);
};

export function createAnalytics<R extends EventRegistry>(
  registry: R,
  adapter: AnalyticsAdapter = noopAdapter,
  report: RejectionReporter = consoleRejectionReporter,
): AnalyticsProvider<R> {
  return {
    track(name, props) {
      const schema = Object.hasOwn(registry, name) ? registry[name] : undefined;
      if (!schema) {
        report({ name, reason: "unknown_event" });
        return;
      }
      const parsed = schema.safeParse(props);
      if (!parsed.success) {
        report({ name, reason: "invalid_payload" });
        return;
      }
      adapter.send(name, parsed.data);
    },
  };
}

/** Default provider: foundation registry, no-op adapter. */
export const analytics = createAnalytics(ALLOWED_EVENTS);
