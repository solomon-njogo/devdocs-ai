"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";

/** chart + resolved theme → rendered SVG (session cache). */
const svgCache = new Map<string, string>();

let lastMermaidTheme: "light" | "dark" | null = null;

async function getMermaid(resolved: "light" | "dark") {
  const m = (await import("mermaid")).default;
  if (lastMermaidTheme !== resolved) {
    m.initialize({
      startOnLoad: false,
      theme: resolved === "dark" ? "dark" : "default",
      /** Avoid embedding Mermaid’s built-in error SVG (“Syntax error in text”, version line). */
      suppressErrorRendering: true,
    });
    lastMermaidTheme = resolved;
  }
  return m;
}

/** Some failures still return SVG text; never surface Mermaid’s internal error copy to readers. */
function looksLikeMermaidErrorSvg(svg: string): boolean {
  const t = svg.toLowerCase();
  return (
    t.includes("syntax error in text") ||
    (t.includes("parse error") && t.includes("mermaid")) ||
    t.includes("error in diagram")
  );
}

function cacheKey(resolved: "light" | "dark", chart: string) {
  return `${resolved}::${chart}`;
}

export default function MermaidDiagram({ chart }: { chart: string }) {
  const { resolved } = useTheme();
  const key = cacheKey(resolved, chart);
  const [svgContent, setSvgContent] = useState<string>(() => svgCache.get(key) ?? "");
  const chartRef = useRef(chart);
  const resolvedRef = useRef(resolved);

  useEffect(() => {
    chartRef.current = chart;
    resolvedRef.current = resolved;

    const ck = cacheKey(resolved, chart);
    let cancelled = false;

    if (svgCache.has(ck)) {
      queueMicrotask(() => {
        if (!cancelled) setSvgContent(svgCache.get(ck)!);
      });
      return () => {
        cancelled = true;
      };
    }

    queueMicrotask(() => {
      if (!cancelled) setSvgContent("");
    });

    (async () => {
      try {
        const mermaid = await getMermaid(resolved);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (looksLikeMermaidErrorSvg(svg)) {
          throw new Error("Mermaid produced an error diagram");
        }
        if (
          !cancelled &&
          chartRef.current === chart &&
          resolvedRef.current === resolved
        ) {
          svgCache.set(ck, svg);
          setSvgContent(svg);
        }
      } catch (err) {
        console.error("Mermaid render failed", { err, chartLength: chart.length });
        if (!cancelled) {
          setSvgContent("__error__");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, resolved]);

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
        <code className="font-mono whitespace-pre">{chart}</code>
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
