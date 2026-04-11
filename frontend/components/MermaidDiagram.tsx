"use client";

import { useEffect, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
});

export default function MermaidDiagram({ chart }: { chart: string }) {
  const [svgContent, setSvgContent] = useState<string>("");

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        if (isMounted) setSvgContent(svg);
      } catch (err) {
        console.error("Mermaid parsing error:", err);
        if (isMounted) {
          setSvgContent(
            `<div class="p-4 border border-red-500 bg-red-500/10 text-red-500 rounded-lg text-sm overflow-auto">Failed to render Mermaid diagram</div>`
          );
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (!svgContent) {
    return (
      <div className="flex justify-center my-6 w-full">
        <div className="animate-pulse w-full h-32 bg-surface-hover/50 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center my-6 mermaid-wrapper overflow-x-auto w-full"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
