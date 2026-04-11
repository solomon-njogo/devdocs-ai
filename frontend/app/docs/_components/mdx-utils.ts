import type { ReactNode } from "react";

export function resolveDocHref(href: string, projectSlug?: string): string {
  if (!projectSlug) return href;
  if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (href.startsWith(`/docs/${projectSlug}/`)) return href;

  let slug = href.replace(/^(\.\.?\/)+/, "");
  slug = slug.replace(/\.mdx?$/, "");

  if (!slug) return href;
  if (href.startsWith("/") && !href.startsWith("/docs/")) return href;

  return `/docs/${projectSlug}/${slug}`;
}

export function toHeadingId(children: ReactNode): string {
  return String(children ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

