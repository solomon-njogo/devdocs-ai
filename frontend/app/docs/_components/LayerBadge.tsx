"use client";

const LAYER_CONFIG: Record<string, { label: string; color: string }> = {
  concept: {
    label: "Concept",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  quickstart: {
    label: "Quickstart",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  howto: {
    label: "How-to",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  reference: {
    label: "Reference",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
};

export function LayerBadge({ layer }: { layer: string }) {
  const config = LAYER_CONFIG[layer] ?? LAYER_CONFIG.concept;
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}
