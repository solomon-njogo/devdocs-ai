"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface RegenerateDocsButtonProps {
  projectId: string;
}

type State = "idle" | "loading" | "success" | "error";

export function RegenerateDocsButton({ projectId }: RegenerateDocsButtonProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleRegen() {
    if (state === "loading") return;
    setState("loading");
    setErrorMsg("");
    try {
      await api(`/api/projects/${projectId}/index`, { method: "POST" });
      setState("success");
      // Reset to idle after 4 s
      setTimeout(() => setState("idle"), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  const isLoading = state === "loading";

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleRegen}
        disabled={isLoading}
        title="Regenerate documentation from the latest codebase"
        className={`
          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium
          border transition-all duration-200 group
          ${state === "success"
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : state === "error"
              ? "border-red-400/30 bg-red-400/10 text-red-600 dark:text-red-400"
              : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:border-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          }
        `}
      >
        {/* Icon */}
        <span className={`shrink-0 ${isLoading ? "animate-spin" : state === "success" ? "" : "group-hover:rotate-180 transition-transform duration-500"}`}>
          {state === "success" ? (
            // Checkmark
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : state === "error" ? (
            // X
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Refresh arrows
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3" />
            </svg>
          )}
        </span>

        {/* Label */}
        <span>
          {state === "loading"
            ? "Regenerating…"
            : state === "success"
              ? "Pipeline triggered!"
              : state === "error"
                ? "Failed — retry?"
                : "Regenerate docs"}
        </span>
      </button>

      {/* Error detail */}
      {state === "error" && errorMsg && (
        <p className="text-[11px] text-red-500/80 px-1 leading-tight">{errorMsg}</p>
      )}

      {/* Success hint */}
      {state === "success" && (
        <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/60 px-1 leading-tight">
          Docs will refresh in a few minutes.
        </p>
      )}
    </div>
  );
}
