import { useId, type ReactNode } from "react";

/** Attributes a control must spread to be associated with its FormField. */
export type ControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
  "aria-required"?: true;
};

export type FieldCopy = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

/** Wires label, hint and error to a control. Generates ids so callers never hand-wire ARIA. */
export function useFieldIds(copy: Pick<FieldCopy, "hint" | "error" | "required">, idProp?: string) {
  const generated = useId();
  const id = idProp ?? generated;
  const hintId = copy.hint ? `${id}-hint` : undefined;
  const errorId = copy.error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const control: ControlProps = {
    id,
    "aria-describedby": describedBy,
    ...(copy.error ? { "aria-invalid": true as const } : {}),
    ...(copy.required ? { "aria-required": true as const } : {}),
  };
  return { id, hintId, errorId, control };
}

export function FieldMessages({
  hint,
  error,
  hintId,
  errorId,
}: {
  hint?: string;
  error?: string;
  hintId?: string;
  errorId?: string;
}) {
  return (
    <>
      {hint ? (
        <p id={hintId} className="text-sm text-(--nb-muted)">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-2 text-sm text-(--nb-danger)">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="mt-0.5 size-4 shrink-0"
            fill="currentColor"
          >
            <path d="M10 1.5 19 17.5H1L10 1.5Zm-1 6v5h2v-5H9Zm0 6.5v2h2v-2H9Z" />
          </svg>
          <span>
            <span className="sr-only">Error: </span>
            {error}
          </span>
        </p>
      ) : null}
    </>
  );
}

export type FormFieldProps = FieldCopy & {
  id?: string;
  children: (control: ControlProps) => ReactNode;
};

export function FormField({ children, id: idProp, ...copy }: FormFieldProps) {
  const { id, hintId, errorId, control } = useFieldIds(copy, idProp);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-(--nb-text)">
        {copy.label}
        {copy.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children(control)}
      <FieldMessages hint={copy.hint} error={copy.error} hintId={hintId} errorId={errorId} />
    </div>
  );
}

export const controlClass =
  "min-h-11 w-full rounded-xl border border-(--nb-border) bg-(--nb-surface) px-4 text-(--nb-text) aria-[invalid=true]:border-(--nb-danger) aria-[invalid=true]:border-2 disabled:cursor-not-allowed disabled:opacity-60";
