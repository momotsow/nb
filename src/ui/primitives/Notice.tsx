import type { ReactNode } from "react";

export type NoticeTone = "info" | "success" | "error";

const icons: Record<NoticeTone, string> = {
  info: "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1 4h2v2H9v-2Zm0 4h2v5H9v-5Z",
  success:
    "M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Zm-1.2 11.9-3.2-3.2 1.4-1.4 1.8 1.8 4.2-4.2 1.4 1.4-5.6 5.6Z",
  error: "M10 1.5 19 17.5H1L10 1.5Zm-1 6v5h2v-5H9Zm0 6.5v2h2v-2H9Z",
};
const labels: Record<NoticeTone, string> = {
  info: "Information",
  success: "Success",
  error: "Error",
};
const colours: Record<NoticeTone, string> = {
  info: "text-(--nb-text)",
  success: "text-(--nb-success)",
  error: "text-(--nb-danger)",
};

export type NoticeProps = { tone?: NoticeTone; title?: string; children: ReactNode };

/** Status (polite) for info/success, alert (assertive) for errors. Icon + text, never colour alone. */
export function Notice({ tone = "info", title, children }: NoticeProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex items-start gap-3 rounded-xl border border-(--nb-border) bg-(--nb-surface) p-4 text-(--nb-text)"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className={`mt-0.5 size-5 shrink-0 ${colours[tone]}`}
        fill="currentColor"
      >
        <path d={icons[tone]} />
      </svg>
      <div className="text-sm">
        <p className={`font-medium ${colours[tone]}`}>
          <span className="sr-only">{labels[tone]}: </span>
          {title ?? labels[tone]}
        </p>
        <div>{children}</div>
      </div>
    </div>
  );
}
