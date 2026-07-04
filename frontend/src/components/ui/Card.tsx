import clsx from "clsx";
import type { ElementType, PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  as?: ElementType;
  className?: string;
}

export function Card({
  as: Component = "article",
  className,
  children,
}: CardProps) {
  return (
    <Component
      className={clsx(
        "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm theme-dark:border-slate-700 theme-dark:bg-slate-900",
        className,
      )}
    >
      {children}
    </Component>
  );
}
