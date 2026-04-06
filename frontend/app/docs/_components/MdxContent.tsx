"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState, useCallback, type ComponentPropsWithoutRef } from "react";

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <button
      onClick={copy}
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity rounded px-2 py-1 text-xs bg-background/80 text-muted-foreground hover:text-foreground border"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

/**
 * Resolve relative or bare-slug doc links to absolute wiki paths.
 * Handles: ./foo, ../how-to/x, how-to/x (no leading slash, no protocol).
 */
function resolveDocHref(href: string, projectSlug?: string): string {
  if (!projectSlug) return href;
  if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return href;

  // Already an absolute docs path
  if (href.startsWith(`/docs/${projectSlug}/`)) return href;

  // Strip leading ./ or ../
  let slug = href.replace(/^(\.\.?\/)+/, "");
  // Strip .md extension if the LLM added one
  slug = slug.replace(/\.md$/, "");

  if (!slug) return href;

  // If it already has a leading slash but isn't a docs path, leave it
  if (href.startsWith("/") && !href.startsWith("/docs/")) return href;

  return `/docs/${projectSlug}/${slug}`;
}

export function MdxContent({ source, projectSlug }: { source: string; projectSlug?: string }) {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={source}
        components={{
          pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => {
            const codeText =
              typeof children === "object" && children !== null && "props" in (children as Record<string, unknown>)
                ? String((children as { props?: { children?: unknown } }).props?.children ?? "")
                : String(children ?? "");
            return (
              <div className="relative group">
                <pre className="rounded-lg bg-muted p-4 overflow-x-auto text-sm" {...props}>
                  {children}
                </pre>
                <CopyButton code={codeText} />
              </div>
            );
          },
          table: (props: ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto my-4">
              <table className="w-full border-collapse text-sm" {...props} />
            </div>
          ),
          th: (props: ComponentPropsWithoutRef<"th">) => (
            <th className="border px-3 py-2 bg-muted text-left font-semibold" {...props} />
          ),
          td: (props: ComponentPropsWithoutRef<"td">) => (
            <td className="border px-3 py-2" {...props} />
          ),
          blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote
              className="border-l-4 border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/40 px-4 py-3 my-4 text-sm"
              {...props}
            />
          ),
          a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
            const resolved = resolveDocHref(href ?? "", projectSlug);
            const isExternal = resolved.startsWith("http");
            return (
              <a
                href={resolved}
                className="text-blue-600 dark:text-blue-400 hover:underline"
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => {
            const id = String(children ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return <h2 id={id} className="scroll-mt-20" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => {
            const id = String(children ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return <h3 id={id} className="scroll-mt-20" {...props}>{children}</h3>;
          },
        }}
      />
    </div>
  );
}
