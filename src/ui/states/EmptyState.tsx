import type { ReactNode } from "react";

export type StateProps = {
  title: string;
  description?: string;
  /** Typically a Button or Link. */
  action?: ReactNode;
  headingLevel?: "h2" | "h3";
};

export function EmptyState({
  title,
  description,
  action,
  headingLevel: Heading = "h2",
}: StateProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-(--nb-border) bg-(--nb-surface) p-8 text-center text-(--nb-text)">
      <Heading className="text-2xl">{title}</Heading>
      {description ? <p className="text-(--nb-muted)">{description}</p> : null}
      {action}
    </section>
  );
}
