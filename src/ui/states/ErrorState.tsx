import type { StateProps } from "./EmptyState";

export function ErrorState({
  title,
  description,
  action,
  headingLevel: Heading = "h2",
}: StateProps) {
  return (
    <section
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border-2 border-(--nb-danger) bg-(--nb-surface) p-8 text-center text-(--nb-text)"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="size-6 text-(--nb-danger)"
        fill="currentColor"
      >
        <path d="M10 1.5 19 17.5H1L10 1.5Zm-1 6v5h2v-5H9Zm0 6.5v2h2v-2H9Z" />
      </svg>
      <Heading className="text-2xl">{title}</Heading>
      {description ? <p className="text-(--nb-muted)">{description}</p> : null}
      {action}
    </section>
  );
}
