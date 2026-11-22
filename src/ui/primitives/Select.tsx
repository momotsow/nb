import type { SelectHTMLAttributes } from "react";
import { FormField, controlClass, type FieldCopy } from "./FormField";

export type SelectProps = FieldCopy & Omit<SelectHTMLAttributes<HTMLSelectElement>, "required">;

/** Native select: keyboard and screen reader behaviour comes from the platform. */
export function Select({
  label,
  hint,
  error,
  required,
  id,
  className = "",
  children,
  ...rest
}: SelectProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id}>
      {(control) => (
        <select
          required={required}
          className={`${controlClass} ${className}`.trim()}
          {...control}
          {...rest}
        >
          {children}
        </select>
      )}
    </FormField>
  );
}
