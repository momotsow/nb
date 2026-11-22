import NextLink from "next/link";
import type { ComponentProps } from "react";

export type LinkProps = ComponentProps<typeof NextLink> & {
  /** "inline" sits within text; "standalone" gets a 44px touch target. */
  display?: "inline" | "standalone";
};

export function Link({ display = "inline", className = "", ...rest }: LinkProps) {
  const size = display === "standalone" ? "inline-flex min-h-11 items-center" : "";
  return (
    <NextLink
      className={`${size} text-(--nb-text) underline underline-offset-4 hover:text-(--nb-accent-strong) ${className}`.trim()}
      {...rest}
    />
  );
}
