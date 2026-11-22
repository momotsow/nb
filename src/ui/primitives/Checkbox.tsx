import type { InputHTMLAttributes } from "react";
import { FieldMessages, useFieldIds, type FieldCopy } from "./FormField";

export type CheckboxProps = FieldCopy &
  Omit<InputHTMLAttributes<HTMLInputElement>, "required" | "type">;

export function Checkbox({
  label,
  hint,
  error,
  required,
  id: idProp,
  className = "",
  ...rest
}: CheckboxProps) {
  const { id, hintId, errorId, control } = useFieldIds({ hint, error, required }, idProp);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          required={required}
          className={`size-6 shrink-0 accent-(--nb-accent-strong) disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
          {...control}
          {...rest}
        />
        <label htmlFor={id} className="text-sm text-(--nb-text)">
          {label}
          {required ? <span aria-hidden="true"> *</span> : null}
        </label>
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
}
