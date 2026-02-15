import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  children: ReactNode;
  /** Optional card title (avoid using HTML title attribute on Card) */
  title?: ReactNode;
  /** Optional footer (e.g. actions) */
  footer?: ReactNode;
  /** Use subtle shadow for elevation */
  elevated?: boolean;
}

/**
 * Container card with optional title and footer. Uses surface and border tokens.
 */
export function Card({
  title,
  footer,
  elevated = false,
  children,
  className = "",
  ...props
}: CardProps) {
  const base =
    "rounded-lg border border-surface-border bg-bg-secondary overflow-hidden";
  const shadow = elevated ? "shadow-md" : "";

  return (
    <div className={`${base} ${shadow} ${className}`.trim()} {...props}>
      {title && (
        <div className="px-4 py-3 border-b border-surface-border text-text-primary font-semibold text-base">
          {title}
        </div>
      )}
      <div className="p-4 text-text-primary text-base">{children}</div>
      {footer && (
        <div className="px-4 py-3 border-t border-surface-border bg-surface-hover/50">
          {footer}
        </div>
      )}
    </div>
  );
}
