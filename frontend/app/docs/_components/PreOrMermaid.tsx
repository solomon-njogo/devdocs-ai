"use client";

import dynamic from "next/dynamic";
import type { ComponentPropsWithoutRef } from "react";
import { PreWithCopy } from "./PreWithCopy";

const MermaidDiagram = dynamic(() => import("@/components/MermaidDiagram"), { ssr: false });

/**
 * Used by MdxContent (server component) — must be a client component so
 * we can lazily load mermaid. Inspects the child <code> className and
 * routes mermaid fences to MermaidDiagram, everything else to PreWithCopy.
 */
export function PreOrMermaid(props: ComponentPropsWithoutRef<"pre">) {
  // react-markdown / next-mdx-remote puts language-* on the <code> child
  const child = props.children as
    | { type?: string | ((...args: unknown[]) => unknown); props?: { className?: string; children?: unknown } }
    | undefined
    | null;

  const className =
    child && typeof child === "object" && "props" in child
      ? (child.props?.className ?? "")
      : "";

  if (className.includes("language-mermaid")) {
    const code = child && typeof child === "object" && "props" in child
      ? String(child.props?.children ?? "").replace(/\n$/, "")
      : "";
    return <MermaidDiagram chart={code} />;
  }

  return <PreWithCopy {...props} />;
}
