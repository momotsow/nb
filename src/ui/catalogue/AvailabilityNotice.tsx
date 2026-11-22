import type { Availability } from "./types";

export const availabilityText: Record<Availability, string> = {
  IN_STOCK: "In stock",
  LOW_STOCK: "Low stock",
  OUT_OF_STOCK: "Out of stock",
};

export const DEGRADED_TEXT = "Availability is temporarily unavailable. Please try again shortly.";

const icons: Record<Availability | "DEGRADED", string> = {
  IN_STOCK:
    "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1.2 11.9-3.2-3.2 1.4-1.4 1.8 1.8 4.2-4.2 1.4 1.4-5.6 5.6Z",
  LOW_STOCK: "M10 1.5 19 17.5H1L10 1.5Zm-1 6v5h2v-5H9Zm0 6.5v2h2v-2H9Z",
  OUT_OF_STOCK:
    "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm3.5 10.6-1.4 1.4L10 11.4l-2.1 2.1-1.4-1.4L8.6 10 6.5 7.9l1.4-1.4L10 8.6l2.1-2.1 1.4 1.4L11.4 10l2.1 2.1Z",
  DEGRADED: "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1 4h2v2H9v-2Zm0 4h2v5H9v-5Z",
};

const colours: Record<Availability | "DEGRADED", string> = {
  IN_STOCK: "text-(--nb-success)",
  LOW_STOCK: "text-(--nb-text)",
  OUT_OF_STOCK: "text-(--nb-danger)",
  DEGRADED: "text-(--nb-text)",
};

export type AvailabilityNoticeProps = {
  availability: Availability;
  /** Availability could not be read, so every item shows as out of stock. */
  degraded?: boolean;
  className?: string;
};

/**
 * Icon plus text, never colour alone. Not a live region itself: VariantSelector announces
 * changes through LiveRegion so the message is not spoken twice.
 */
export function AvailabilityNotice({
  availability,
  degraded = false,
  className = "",
}: AvailabilityNoticeProps) {
  const key = degraded ? "DEGRADED" : availability;
  return (
    <p className={`flex items-center gap-2 text-sm ${colours[key]} ${className}`.trim()}>
      <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0" fill="currentColor">
        <path d={icons[key]} />
      </svg>
      <span>{degraded ? DEGRADED_TEXT : availabilityText[availability]}</span>
    </p>
  );
}
