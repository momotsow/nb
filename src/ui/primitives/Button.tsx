import type { ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const base =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full px-6 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const variants = {
  primary: "bg-(--nb-text) text-(--nb-bg) hover:opacity-90",
  secondary: "border border-(--nb-border) bg-transparent text-(--nb-text) hover:bg-(--nb-surface)",
} as const;

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={`${base} ${variants[variant]} ${className}`.trim()} {...rest} />
  );
}
