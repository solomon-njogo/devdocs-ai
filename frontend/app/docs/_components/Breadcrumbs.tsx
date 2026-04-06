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
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4 flex-wrap">
      <Link
        href={`/docs/${projectSlug}`}
        className="hover:text-foreground transition-colors truncate max-w-[10rem]"
      >
        {projectName}
      </Link>
      <span aria-hidden>/</span>
      <span className="truncate max-w-[8rem]">{layerLabel}</span>
      <span aria-hidden>/</span>
      <span className="text-foreground font-medium truncate max-w-[14rem]">{docTitle}</span>
    </nav>
  );
}
