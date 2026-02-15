import type { ReactNode } from "react";

export type BadgeVariant = "success" | "error" | "warning" | "info" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success:
    "bg-semantic-success-bg text-semantic-success-text border border-semantic-success-text/30",
  error: "bg-semantic-error-bg text-semantic-error-text border border-semantic-error-text/30",
  warning:
    "bg-semantic-warning-bg text-semantic-warning-text border border-semantic-warning-text/30",
  info: "bg-semantic-info-bg text-semantic-info-text border border-semantic-info-text/30",
  neutral:
    "bg-bg-secondary text-text-secondary border border-surface-border",
};

/**
 * Pill-style badge for status or labels. Uses semantic colors from the design system.
 */
export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  const base =
    "inline-flex items-center font-medium rounded-radius-badge px-2.5 py-0.5 text-xs uppercase tracking-wide";
  const variantClass = variantClasses[variant];

  return (
    <span className={`${base} ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  );
}
