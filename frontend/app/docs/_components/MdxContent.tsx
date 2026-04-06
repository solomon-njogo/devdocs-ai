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
      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all rounded-md px-2 py-1 text-[11px] font-medium bg-background/90 text-muted-foreground hover:text-foreground border border-border backdrop-blur-sm"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function resolveDocHref(href: string, projectSlug?: string): string {
  if (!projectSlug) return href;
  if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto:")) return href;
  if (href.startsWith(`/docs/${projectSlug}/`)) return href;

  let slug = href.replace(/^(\.\.?\/)+/, "");
  slug = slug.replace(/\.md$/, "");

  if (!slug) return href;
  if (href.startsWith("/") && !href.startsWith("/docs/")) return href;

  return `/docs/${projectSlug}/${slug}`;
}

export function MdxContent({ source, projectSlug }: { source: string; projectSlug?: string }) {
  return (
    <div className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        children={source}
        components={{
          pre: ({ children, ...props }: ComponentPropsWithoutRef<"pre">) => {
            let codeText = "";
            try {
              const child = children as unknown as { props?: { children?: unknown } } | null;
              if (child && typeof child === "object" && "props" in child) {
                codeText = String(child.props?.children ?? "");
              } else {
                codeText = String(children ?? "");
              }
            } catch {
              codeText = String(children ?? "");
            }
            return (
              <div className="relative group not-prose">
                <pre {...props}>
                  {children}
                </pre>
                <CopyButton code={codeText} />
              </div>
            );
          },
          table: (props: ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-border">
              <table {...props} />
            </div>
          ),
          th: (props: ComponentPropsWithoutRef<"th">) => (
            <th {...props} />
          ),
          td: (props: ComponentPropsWithoutRef<"td">) => (
            <td {...props} />
          ),
          blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => (
            <blockquote {...props} />
          ),
          a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
            const resolved = resolveDocHref(href ?? "", projectSlug);
            const isExternal = resolved.startsWith("http");
            return (
              <a
                href={resolved}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                {...props}
              >
                {children}
                {isExternal && (
                  <svg className="inline-block w-3 h-3 ml-0.5 -mt-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                )}
              </a>
            );
          },
          h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => {
            const id = String(children ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return <h2 id={id} className="scroll-mt-24" {...props}>{children}</h2>;
          },
          h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => {
            const id = String(children ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return <h3 id={id} className="scroll-mt-24" {...props}>{children}</h3>;
          },
          h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => {
            const id = String(children ?? "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "");
            return <h4 id={id} className="scroll-mt-24" {...props}>{children}</h4>;
          },
        }}
      />
    </div>
  );
}
