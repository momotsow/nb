import type { InputHTMLAttributes } from "react";
import { FormField, controlClass, type FieldCopy } from "./FormField";

export type TextFieldProps = FieldCopy &
  Omit<InputHTMLAttributes<HTMLInputElement>, "required" | "children">;

export function TextField({
  label,
  hint,
  error,
  required,
  id,
  className = "",
  ...rest
}: TextFieldProps) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id}>
      {(control) => (
        <input
          type="text"
          required={required}
          className={`${controlClass} ${className}`.trim()}
          {...control}
          {...rest}
        />
      )}
    </FormField>
  );
}
