"use server";

import { analytics } from "@/integrations/analytics/provider";
import type { AnalyticsEventName } from "@/integrations/analytics/events";

/**
 * Client-intent entry point for analytics. Emission stays server-side and goes through the
 * allow-listed AnalyticsProvider, which validates the name and strict payload. Unknown events
 * and extra keys are dropped there, never thrown, so callers can fire and forget.
 */
export async function trackEvent(name: string, props: Record<string, unknown>): Promise<void> {
  if (typeof name !== "string" || typeof props !== "object" || props === null) return;
  analytics.track(name as AnalyticsEventName, props as never);
}
