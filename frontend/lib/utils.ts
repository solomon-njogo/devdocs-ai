import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind classes; later classes override earlier.
 * Used by shadcn/ui and design-system components.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
