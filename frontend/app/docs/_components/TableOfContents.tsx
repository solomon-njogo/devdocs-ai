"use client";

import { useMemo, useEffect, useState, useCallback } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function extractHeadings(markdown: string): TocItem[] {
  const headingRegex = /^(#{2,4})\s+(.+)$/gm;
  const items: TocItem[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[`*_~]/g, "").trim();
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    items.push({ id, text, level });
  }
  return items;
}

export function TableOfContents({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeId, setActiveId] = useState<string>("");

  const handleScroll = useCallback(() => {
    const headingElements = headings
      .map((h) => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    let current = "";
    for (const el of headingElements) {
      if (el.getBoundingClientRect().top <= 100) {
        current = el.id;
      }
    }
    setActiveId(current);
  }, [headings]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    const raf = window.requestAnimationFrame(handleScroll);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  if (headings.length === 0) return null;

  return (
    <nav className="hidden xl:block w-[220px] shrink-0 sticky top-12 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="pl-6 border-l border-border">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          On this page
        </p>
        <ul className="space-y-1">
          {headings.map((h, i) => {
            const isActive = activeId === h.id;
            return (
              <li
                key={`${h.id}-${i}`}
                style={{ paddingLeft: `${(h.level - 2) * 12}px` }}
              >
                <a
                  href={`#${h.id}`}
                  className={`block py-1 text-[13px] leading-snug transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {h.text}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
