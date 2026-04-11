"use client";

import type { ComponentPropsWithoutRef } from "react";
import { CopyButton } from "./CopyButton";

export function PreWithCopy({ children, ...props }: ComponentPropsWithoutRef<"pre">) {
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
      <pre {...props}>{children}</pre>
      <CopyButton code={codeText} />
    </div>
  );
}

