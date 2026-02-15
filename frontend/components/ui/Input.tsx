import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

const baseInput =
  "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-1.5 text-base placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg-primary transition-[box-shadow] duration-[var(--duration-fast)] disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Text input using design system tokens. Supports label, error, hint, and addons.
 */
export function Input({
  label,
  error,
  hint,
  leftAddon,
  rightAddon,
  id: idProp,
  className = "",
  ...props
}: InputProps) {
  const id = idProp ?? `input-${Math.random().toString(36).slice(2, 9)}`;
  const hasAddons = leftAddon ?? rightAddon;

  const inputEl = (
    <input
      id={id}
      className={`${baseInput} ${error ? "border-semantic-error-text" : ""} ${className}`.trim()}
      aria-invalid={!!error}
      aria-describedby={
        [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined
      }
      {...props}
    />
  );

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary mb-1.5">
          {label}
        </label>
      )}
      {hasAddons ? (
        <div
          className={`flex rounded-input border overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-bg-primary focus-within:border-transparent ${error ? "border-semantic-error-text" : "border-surface-border"}`}
        >
          {leftAddon && (
            <span className="flex items-center bg-bg-secondary text-text-muted px-3 text-sm border-r border-surface-border">
              {leftAddon}
            </span>
          )}
          <input
            id={id}
            className={`${baseInput} border-0 rounded-sm focus:ring-0 focus:ring-offset-0 ${error ? "border-semantic-error-text" : ""} ${className}`.trim()}
            aria-invalid={!!error}
            aria-describedby={
              [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined
            }
            {...props}
          />
          {rightAddon && (
            <span className="flex items-center bg-bg-secondary text-text-muted px-3 text-sm border-l border-surface-border">
              {rightAddon}
            </span>
          )}
        </div>
      ) : (
        inputEl
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-semantic-error-text" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
