"use client";

import { useState } from "react";
import { NavTree, type NavGroup } from "./Sidebar";

export function DocsMobileNav({
  tree,
  projectSlug,
  projectName,
}: {
  tree: NavGroup[];
  projectSlug: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        aria-label="Toggle navigation"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
        <span className="font-medium">{projectName}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative z-50 w-72 max-w-[80vw] h-full bg-background border-r shadow-xl overflow-y-auto px-4 py-6 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">{projectName}</h2>
                <p className="text-xs text-muted-foreground mt-1">Documentation</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-accent/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <NavTree tree={tree} projectSlug={projectSlug} />
          </div>
        </div>
      )}
    </div>
  );
}
