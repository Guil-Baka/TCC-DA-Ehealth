import clsx from "clsx";
import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { Link, type LinkProps } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-sm",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "border border-teal-600 bg-teal-600 text-white hover:bg-teal-500",
  secondary:
    "border border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 theme-dark:border-amber-700 theme-dark:bg-amber-900/30 theme-dark:text-amber-100 theme-dark:hover:bg-amber-800/40",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:border-teal-500 hover:text-teal-700 theme-dark:border-slate-600 theme-dark:bg-slate-900 theme-dark:text-slate-100 theme-dark:hover:border-teal-400 theme-dark:hover:text-teal-300",
  danger:
    "border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 theme-dark:border-rose-700 theme-dark:bg-slate-900 theme-dark:text-rose-300 theme-dark:hover:bg-rose-900/20",
};

function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false,
) {
  return clsx(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-70",
    sizeStyles[size],
    variantStyles[variant],
    fullWidth && "w-full",
  );
}

interface AppButtonProps
  extends
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">,
    PropsWithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={clsx(buttonClasses(variant, size, fullWidth), className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps
  extends Omit<LinkProps, "className">, PropsWithChildren {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

export function LinkButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={clsx(buttonClasses(variant, size, fullWidth), className)}
      {...props}
    >
      {children}
    </Link>
  );
}
