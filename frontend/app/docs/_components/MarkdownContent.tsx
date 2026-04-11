"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";
import { PreWithCopy } from "./PreWithCopy";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon";
import { resolveDocHref, toHeadingId } from "./mdx-utils";
import dynamic from "next/dynamic";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

export function MarkdownContent({ source, projectSlug }: { source: string; projectSlug?: string }) {
  return (
    <div className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: (props: ComponentPropsWithoutRef<"pre">) => <PreWithCopy {...props} />,
          // react-markdown places language-* class on the <code> element — intercept mermaid here
          code: ({ className, children, ...props }: ComponentPropsWithoutRef<"code">) => {
            const match = /language-(\w+)/.exec(className || "");
            if (match && match[1] === "mermaid") {
              return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
            }
            return <code className={className} {...props}>{children}</code>;
          },
          table: (props: ComponentPropsWithoutRef<"table">) => (
            <div className="overflow-x-auto my-6 rounded-lg border border-border">
              <table {...props} />
            </div>
          ),
          th: (props: ComponentPropsWithoutRef<"th">) => <th {...props} />,
          td: (props: ComponentPropsWithoutRef<"td">) => <td {...props} />,
          blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => <blockquote {...props} />,
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
                {isExternal && <ExternalLinkIcon />}
              </a>
            );
          },
          h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => {
            const id = toHeadingId(children);
            return (
              <h2 id={id} className="scroll-mt-24" {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => {
            const id = toHeadingId(children);
            return (
              <h3 id={id} className="scroll-mt-24" {...props}>
                {children}
              </h3>
            );
          },
          h4: ({ children, ...props }: ComponentPropsWithoutRef<"h4">) => {
            const id = toHeadingId(children);
            return (
              <h4 id={id} className="scroll-mt-24" {...props}>
                {children}
              </h4>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
