"use client";

import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui";

const LABELS: Record<"light" | "dark" | "system", string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const NEXT: Record<"light" | "dark" | "system", "light" | "dark" | "system"> = {
  light: "dark",
  dark: "system",
  system: "light",
};

/**
 * Cycles theme: light → dark → system → light. Use in header or settings.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(NEXT[theme])}
      aria-label={`Theme: ${LABELS[theme]}. Switch to ${LABELS[NEXT[theme]]}.`}
    >
      {LABELS[theme]}
    </Button>
  );
}
