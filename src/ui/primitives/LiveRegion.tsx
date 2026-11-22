"use client";

import { useCallback, useState } from "react";

export type LiveRegionProps = {
  message: string;
  /** "polite" waits for the user to be idle; "assertive" interrupts. */
  politeness?: "polite" | "assertive";
};

/** Always-mounted announcer: the region must exist before its text changes. */
export function LiveRegion({ message, politeness = "polite" }: LiveRegionProps) {
  return (
    <div
      role={politeness === "assertive" ? "alert" : "status"}
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

/** `const [message, announce] = useAnnouncer(); <LiveRegion message={message} />` */
export function useAnnouncer() {
  const [message, setMessage] = useState("");
  const announce = useCallback((next: string) => {
    // Clear first so repeating an identical message is announced again.
    setMessage("");
    setTimeout(() => setMessage(next), 50);
  }, []);
  return [message, announce] as const;
}
