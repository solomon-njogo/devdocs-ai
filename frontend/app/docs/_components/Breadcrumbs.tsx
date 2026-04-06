import Link from "next/link";

const LAYER_LABELS: Record<string, string> = {
  quickstart: "Getting started",
  concept: "Concepts",
  howto: "How-to guides",
  reference: "API reference",
};

export function Breadcrumbs({
  projectSlug,
  projectName,
  layer,
  docTitle,
}: {
  projectSlug: string;
  projectName: string;
  layer: string;
  docTitle: string;
}) {
  const layerLabel = LAYER_LABELS[layer] ?? layer;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-6 flex-wrap"
    >
      <Link
        href={`/docs/${projectSlug}`}
        className="hover:text-foreground transition-colors"
      >
        {projectName}
      </Link>
      <svg className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
      <span>{layerLabel}</span>
      <svg className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
      <span className="text-foreground font-medium">{docTitle}</span>
    </nav>
  );
}
