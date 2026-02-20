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
    "bg-gradient-to-r from-action-primary to-action-primary-hover text-text-on-primary hover:shadow-[0_0_24px_var(--color-action-primary-glow)] hover:scale-[1.02] active:scale-[0.98] border-0",
  secondary:
    "bg-surface-glass backdrop-blur-sm text-text-primary border border-surface-border hover:border-action-primary/40 hover:bg-surface-hover hover:shadow-[0_0_16px_var(--color-glow)] active:scale-[0.98]",
  ghost:
    "bg-transparent text-text-secondary hover:text-action-primary hover:bg-surface-hover/50 border border-transparent active:scale-[0.98]",
  danger:
    "bg-semantic-error-bg text-semantic-error-text border border-semantic-error-text/30 hover:border-semantic-error-text/60 hover:shadow-[0_0_16px_rgba(239,68,68,0.2)] active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-sm rounded-button gap-1.5",
  md: "px-5 py-2.5 text-base rounded-button gap-2",
  lg: "px-6 py-3 text-md rounded-button gap-2.5 font-semibold",
};

/**
 * Primary button component with Mintlify-inspired styling.
 * Gradient primary, glass secondary, smooth micro-animations.
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
    "inline-flex items-center justify-center font-medium transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none";
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
