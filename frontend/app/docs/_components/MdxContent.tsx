import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { MarkdownContent } from "./MarkdownContent";
import { PreWithCopy } from "./PreWithCopy";
import { ExternalLinkIcon } from "./icons/ExternalLinkIcon";
import { resolveDocHref, toHeadingId } from "./mdx-utils";

export async function MdxContent({ source, projectSlug }: { source: string; projectSlug?: string }) {
  const hrefFor = (href: string) => resolveDocHref(href, projectSlug);

  const components = {
    pre: (props: ComponentPropsWithoutRef<"pre">) => <PreWithCopy {...props} />,
    table: (props: ComponentPropsWithoutRef<"table">) => (
      <div className="overflow-x-auto my-6 rounded-lg border border-border">
        <table {...props} />
      </div>
    ),
    th: (props: ComponentPropsWithoutRef<"th">) => <th {...props} />,
    td: (props: ComponentPropsWithoutRef<"td">) => <td {...props} />,
    blockquote: (props: ComponentPropsWithoutRef<"blockquote">) => <blockquote {...props} />,
    a: ({ href, children, ...props }: ComponentPropsWithoutRef<"a">) => {
      const resolved = hrefFor(href ?? "");
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
  } satisfies Record<string, unknown>;

  let compiled: ReactNode | null = null;
  let mdxOk = true;

  try {
    const { content } = await compileMDX({
      source,
      options: {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
        },
      },
      components,
    });
    compiled = content;
  } catch {
    mdxOk = false;
  }

  if (!mdxOk) return <MarkdownContent source={source} projectSlug={projectSlug} />;
  return <div className="docs-prose">{compiled}</div>;
}
