import type { PropsWithChildren } from "react";
import clsx from "clsx";

interface FormFieldProps extends PropsWithChildren {
  label: string;
  className?: string;
}

export function FormField({ label, className, children }: FormFieldProps) {
  return (
    <label
      className={clsx(
        "block text-sm font-medium text-slate-700 theme-dark:text-slate-200",
        className,
      )}
    >
      <span>{label}</span>
      {children}
    </label>
  );
}
