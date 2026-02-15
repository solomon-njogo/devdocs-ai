import type { ReactNode } from "react";

export type AlertVariant = "success" | "error" | "warning" | "info";

export interface AlertProps {
  variant?: AlertVariant;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<AlertVariant, string> = {
  success:
    "bg-semantic-success-bg border-semantic-success-text/40 text-semantic-success-text [--alert-icon:theme(colors.semantic-success-text)]",
  error:
    "bg-semantic-error-bg border-semantic-error-text/40 text-semantic-error-text [--alert-icon:theme(colors.semantic-error-text)]",
  warning:
    "bg-semantic-warning-bg border-semantic-warning-text/40 text-semantic-warning-text [--alert-icon:theme(colors.semantic-warning-text)]",
  info: "bg-semantic-info-bg border-semantic-info-text/40 text-semantic-info-text [--alert-icon:theme(colors.semantic-info-text)]",
};

/**
 * Semantic alert banner for success, error, warning, or info messages.
 */
export function Alert({ variant = "info", title, children, className = "" }: AlertProps) {
  const base =
    "rounded-radius-input border px-4 py-3 text-base";
  const variantClass = variantClasses[variant];

  return (
    <div
      role="alert"
      className={`${base} ${variantClass} ${className}`.trim()}
    >
      {title && <p className="font-semibold mb-1">{title}</p>}
      <p className={title ? "text-sm opacity-90" : ""}>{children}</p>
    </div>
  );
}
