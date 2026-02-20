import type { InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftAddon?: ReactNode;
  rightAddon?: ReactNode;
}

const baseInput =
  "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-4 py-2.5 text-base placeholder:text-text-faded focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all duration-[var(--duration-normal)] disabled:opacity-40 disabled:cursor-not-allowed";

/**
 * Text input with Mintlify-inspired styling. Emerald glow on focus.
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
      className={`${baseInput} ${error ? "border-semantic-error-text focus:ring-semantic-error-text/30" : ""} ${className}`.trim()}
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
        <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-2">
          {label}
        </label>
      )}
      {hasAddons ? (
        <div
          className={`flex rounded-input border overflow-hidden focus-within:ring-2 focus-within:ring-action-primary/30 focus-within:border-action-primary transition-all duration-[var(--duration-normal)] ${error ? "border-semantic-error-text" : "border-surface-border"}`}
        >
          {leftAddon && (
            <span className="flex items-center bg-bg-tertiary text-text-muted px-4 text-sm border-r border-surface-border">
              {leftAddon}
            </span>
          )}
          <input
            id={id}
            className={`${baseInput} border-0 rounded-none focus:ring-0 ${error ? "border-semantic-error-text" : ""} ${className}`.trim()}
            aria-invalid={!!error}
            aria-describedby={
              [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(" ") || undefined
            }
            {...props}
          />
          {rightAddon && (
            <span className="flex items-center bg-bg-tertiary text-text-muted px-4 text-sm border-l border-surface-border">
              {rightAddon}
            </span>
          )}
        </div>
      ) : (
        inputEl
      )}
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-semantic-error-text" role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-2 text-sm text-text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
