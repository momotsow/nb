import type { HTMLAttributes } from "react";

/** Content available to assistive technology only. */
export function VisuallyHidden({ className = "", ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`sr-only ${className}`.trim()} {...rest} />;
}
