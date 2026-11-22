/** First focusable element on every page. Visible only while focused. */
export function SkipLink({ targetId = "main" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:bg-(--nb-text) focus:px-6 focus:text-sm focus:text-(--nb-bg)"
    >
      Skip to main content
    </a>
  );
}
