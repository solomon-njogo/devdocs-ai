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
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Toggle navigation"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <aside
            className="relative z-50 w-[280px] max-w-[85vw] h-full bg-background border-r border-border shadow-xl overflow-y-auto animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">
                    {projectName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-semibold text-[15px]">{projectName}</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-3 pb-6">
              <NavTree tree={tree} projectSlug={projectSlug} />
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
