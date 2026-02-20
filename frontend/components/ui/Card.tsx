import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  children: ReactNode;
  /** Optional card title */
  title?: ReactNode;
  /** Optional footer (e.g. actions) */
  footer?: ReactNode;
  /** Use elevated glass styling */
  elevated?: boolean;
}

/**
 * Glass-style card with optional title and footer.
 * Mintlify-inspired: backdrop-blur, subtle borders, hover lift.
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
    "rounded-lg border border-surface-border bg-bg-secondary overflow-hidden transition-all duration-[var(--duration-normal)] ease-[var(--ease-default)]";
  const elevation = elevated
    ? "shadow-md hover:shadow-lg hover:border-action-primary/20"
    : "";

  return (
    <div className={`${base} ${elevation} ${className}`.trim()} {...props}>
      {title && (
        <div className="px-5 py-4 border-b border-surface-border">
          <h3 className="text-text-primary font-semibold text-lg">{title}</h3>
        </div>
      )}
      <div className="p-5 text-text-primary text-base">{children}</div>
      {footer && (
        <div className="px-5 py-4 border-t border-surface-border bg-surface-hover/30">
          {footer}
        </div>
      )}
    </div>
  );
}
