"use client";

const LAYER_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  concept: { label: "Concept guide", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300" },
  quickstart: { label: "Quickstart", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300" },
  howto: { label: "How-to guide", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-800 dark:text-amber-300" },
  reference: { label: "API reference", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300" },
};

export function LayerBadge({ layer }: { layer: string }) {
  const config = LAYER_CONFIG[layer] ?? LAYER_CONFIG.concept;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
}
