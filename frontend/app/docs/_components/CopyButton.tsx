"use client";

import { useCallback, useState } from "react";

export function CopyButton({ code }: { code: string }) {
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

