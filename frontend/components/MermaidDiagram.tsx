"use client";

import { useEffect, useRef, useState } from "react";

// Module-level cache: chart text → rendered SVG string.
// Survives remounts within the same page session.
const svgCache = new Map<string, string>();

let mermaidInitialized = false;

async function getMermaid() {
  const m = (await import("mermaid")).default;
  if (!mermaidInitialized) {
    m.initialize({ startOnLoad: false, theme: "dark" });
    mermaidInitialized = true;
  }
  return m;
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svgContent, setSvgContent] = useState<string>(() => svgCache.get(chart) ?? "");
  const chartRef = useRef(chart);

  useEffect(() => {
    chartRef.current = chart;

    // Cache hit — nothing to do.
    if (svgCache.has(chart)) {
      setSvgContent(svgCache.get(chart)!);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const mermaid = await getMermaid();
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && chartRef.current === chart) {
          svgCache.set(chart, svg);
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        if (!cancelled) {
            // Don't cache errors — let a future mount retry.
          setSvgContent("__error__");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (!svgContent) {
    return (
      <div className="flex justify-center my-6 w-full" aria-label="Loading diagram…">
        <div className="animate-pulse w-full h-32 bg-surface-hover/50 rounded-lg" />
      </div>
    );
  }

  if (svgContent === "__error__") {
    return (
      <pre className="my-6 p-4 rounded-lg bg-surface-hover/50 border border-border text-sm overflow-x-auto text-foreground/80">
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div
      className="flex justify-center my-6 mermaid-wrapper overflow-x-auto w-full"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
