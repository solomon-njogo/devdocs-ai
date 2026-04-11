import type { DiátaxisLayer } from "../../../shared/index.js";

const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

export interface LinkSanitizationResult {
  content: string;
  invalidLinksRemoved: number;
}

function normalizeInternalSlug(href: string, projectSlug?: string): string | null {
  const value = href.trim();
  if (!value) return null;
  if (value.startsWith("http") || value.startsWith("mailto:") || value.startsWith("#")) return null;

  if (projectSlug && value.startsWith(`/docs/${projectSlug}/`)) {
    return value.slice(`/docs/${projectSlug}/`.length).replace(/\.mdx?$/i, "");
  }

  if (value.startsWith("./") || value.startsWith("../")) {
    return value.replace(/^(\.\.\/|\.\/)+/, "").replace(/\.mdx?$/i, "");
  }

  if (value.startsWith("/docs/")) return null;
  if (value.startsWith("/")) return null;
  return value.replace(/\.mdx?$/i, "");
}

export function sanitizeInternalDocLinks(
  content: string,
  validSlugs: Set<string>,
  projectSlug?: string
): LinkSanitizationResult {
  let invalidLinksRemoved = 0;

  const next = content.replace(MARKDOWN_LINK_REGEX, (full, label: string, href: string) => {
    const maybeSlug = normalizeInternalSlug(href, projectSlug);
    if (!maybeSlug) return full;
    if (validSlugs.has(maybeSlug)) return full;
    invalidLinksRemoved += 1;
    return label;
  });

  return { content: next, invalidLinksRemoved };
}

export function upsertRelatedSection(
  content: string,
  currentSlug: string,
  projectSlug: string | undefined,
  layer: DiátaxisLayer,
  pages: Array<{ slug: string; title: string; layer: DiátaxisLayer }>
): string {
  const sameLayer = pages
    .filter((p) => p.slug !== currentSlug && p.layer === layer)
    .slice(0, 2);
  const crossLayer = pages
    .filter((p) => p.slug !== currentSlug && p.layer !== layer)
    .slice(0, 2);

  const picks = [...sameLayer, ...crossLayer].slice(0, 3);
  if (picks.length === 0) return content;

  const linkLines = picks.map((p) => {
    const href = projectSlug ? `/docs/${projectSlug}/${p.slug}` : `./${p.slug}`;
    return `- [${p.title}](${href})`;
  });

  const section = `## Related\n\n${linkLines.join("\n")}`;
  const relatedHeadingRegex = /\n##\s+Related(?:\s+guides|\s+links)?[\s\S]*?(?=\n##\s+|$)/i;

  if (relatedHeadingRegex.test(content)) {
    return content.replace(relatedHeadingRegex, `\n${section}\n`);
  }

  return `${content.trim()}\n\n${section}\n`;
}

export function hasEvidenceMarkers(content: string): boolean {
  return /\[source:\s*[^\]]+\]/i.test(content);
}

export function shouldRequireEvidence(layer: DiátaxisLayer): boolean {
  return layer === "concept" || layer === "howto" || layer === "reference";
}
