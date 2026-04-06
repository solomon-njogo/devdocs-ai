/**
 * Docs renderer types.
 * Rows for docs_pages, docs_nav, and related API shapes.
 */

/** Diátaxis documentation layer. */
export type DiátaxisLayer = "concept" | "quickstart" | "howto" | "reference";

/** A generated documentation page stored in docs_pages. */
export interface DocsPage {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  layer: DiátaxisLayer;
  isAuto: boolean;
  sourceFiles: string[];
  sourceSha: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Navigation group for the sidebar. */
export interface NavGroup {
  label: string;
  layer: string;
  items: { title: string; slug: string }[];
}

/** Custom nav config stored in docs_nav. */
export interface DocsNavConfig {
  id: string;
  projectId: string;
  config: { groups: NavGroup[] };
  updatedAt: string;
}

/** A doc job planned by the Diátaxis router. */
export interface DocJob {
  projectId: string;
  layer: DiátaxisLayer;
  slug: string;
  title: string;
  sourceFiles: string[];
  focusQuery: string;
  /** Set by the Inngest orchestrator so the LLM can emit correct wiki links. */
  projectSlug?: string;
  /** Compact list of sibling pages so the LLM can cross-link. */
  siblingPages?: { slug: string; title: string; layer: DiátaxisLayer }[];
}

/** Search result returned from FTS or vector search. */
export interface DocSearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  layer: string;
  rank?: number;
  similarity?: number;
}
