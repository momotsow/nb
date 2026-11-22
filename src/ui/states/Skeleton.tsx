import { VisuallyHidden } from "../primitives/VisuallyHidden";

export type SkeletonProps = {
  className?: string;
  /** When set, the placeholder announces this text to assistive technology. */
  label?: string;
};

export function Skeleton({ className = "h-4 w-full", label }: SkeletonProps) {
  const block = (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-md bg-(--nb-border) ${className}`}
    />
  );
  if (!label) return block;
  return (
    <span role="status" className="block">
      <VisuallyHidden>{label}</VisuallyHidden>
      {block}
    </span>
  );
}
