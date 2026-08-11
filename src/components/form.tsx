import type { ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  hint,
  span = 1,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  span?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <div className={span === 2 ? "sm:col-span-2" : undefined}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function FormGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

export function FormActions({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
      {children}
    </div>
  );
}

export function TextInput({
  name,
  defaultValue,
  type = "text",
  placeholder,
  required,
  step,
  min,
  max,
}: {
  name: string;
  defaultValue?: string | number | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string | number;
  max?: string | number;
}) {
  return (
    <input
      id={name}
      name={name}
      type={type}
      step={step}
      min={min}
      max={max}
      required={required}
      placeholder={placeholder}
      defaultValue={defaultValue ?? undefined}
      className="input"
    />
  );
}

export function Textarea({
  name,
  defaultValue,
  placeholder,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <textarea
      id={name}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue ?? undefined}
      className="textarea"
    />
  );
}

export function Select({
  name,
  options,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  options: readonly string[] | { value: string; label: string }[];
  defaultValue?: string | null;
  /** 값이 없어도 되는 항목에 "선택 안 함" 자리를 만든다. */
  placeholder?: string;
  required?: boolean;
}) {
  const items = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );

  return (
    <select
      id={name}
      name={name}
      required={required}
      defaultValue={defaultValue ?? ""}
      className="select"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {items.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        id={name}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-line-strong accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}
