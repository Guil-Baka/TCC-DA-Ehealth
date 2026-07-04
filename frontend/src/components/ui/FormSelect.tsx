import clsx from "clsx";
import type { PropsWithChildren, SelectHTMLAttributes } from "react";

interface FormSelectProps
  extends PropsWithChildren, SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
}

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select
      className={clsx(
        "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-teal-500 focus:ring theme-dark:border-slate-600 theme-dark:bg-slate-800 theme-dark:text-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
