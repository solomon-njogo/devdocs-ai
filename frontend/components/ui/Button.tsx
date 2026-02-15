import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  /** Optional leading icon */
  leftIcon?: ReactNode;
  /** Optional trailing icon */
  rightIcon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-action-primary text-bg-primary hover:bg-action-primary-hover focus-visible:ring-ring border-0",
  secondary:
    "bg-bg-secondary text-text-primary border border-surface-border hover:bg-surface-hover focus-visible:ring-ring",
  ghost:
    "bg-transparent text-text-primary hover:bg-surface-hover focus-visible:ring-ring border border-transparent",
  danger:
    "bg-semantic-error-text/20 text-semantic-error-text hover:bg-semantic-error-bg focus-visible:ring-ring border border-semantic-error-text/40",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-radius-button gap-1.5",
  md: "px-4 py-2 text-base rounded-radius-button gap-2",
  lg: "px-5 py-2.5 text-md rounded-radius-button gap-2.5",
};

/**
 * Primary button component. Use design system tokens only.
 */
export function Button({
  variant = "primary",
  size = "md",
  children,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-colors duration-[var(--duration-normal)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:pointer-events-none";
  const variantClass = variantClasses[variant];
  const sizeClass = sizeClasses[size];

  return (
    <button
      type="button"
      className={`${base} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {leftIcon && <span className="shrink-0 [&>svg]:size-4">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="shrink-0 [&>svg]:size-4">{rightIcon}</span>}
    </button>
  );
}
