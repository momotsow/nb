"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEventName } from "@/integrations/analytics/events";
import { trackEvent } from "../_actions/track";

type Props = {
  event: AnalyticsEventName;
  /** Ids, slugs, counts and enum values only (R7.2). Validated again server-side. */
  props: Record<string, string | number>;
};

/** Emits one analytics event per mount through a server action. Renders nothing. */
export function TrackOnMount({ event, props }: Props) {
  const sent = useRef(false);
  const key = JSON.stringify(props);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // Fire and forget: analytics failures must never affect the page.
    trackEvent(event, JSON.parse(key) as Record<string, string | number>).catch(() => {});
  }, [event, key]);
  return null;
}
