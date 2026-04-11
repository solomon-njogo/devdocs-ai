"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

export interface DocStage {
  label: string;
  sublabel?: string;
}

export interface EngagingLoaderProps {
  messages?: string[];
  title?: string;
  className?: string;
  /** When provided, renders a checklist-style generation progress view */
  stages?: DocStage[];
  /** Estimated ms per stage (used to auto-advance the checklist) */
  stageIntervalMs?: number;
}

const DEFAULT_LOADING_MESSAGES = [
  "Synthesizing your vision...",
  "Architecting system overview...",
  "Drafting technical specifications...",
  "Generating product requirements...",
  "Building your documentation suite...",
  "Finalizing blueprints...",
];

// ── Spinner mode (indexing) ─────────────────────────────────

function SpinnerLoader({
  messages,
  title,
  className,
}: {
  messages: string[];
  title?: string;
  className?: string;
}) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Card
      elevated
      className={`p-16 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in-scale min-h-[500px] overflow-hidden relative ${className}`}
    >
      {/* Scanning bar */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-border overflow-hidden">
          <div className="h-full bg-action-primary animate-[loading-bar_4s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Icon */}
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl border-2 border-action-primary/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
          <div className="w-16 h-16 rounded-2xl bg-action-primary/10 animate-pulse flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-action-primary animate-bounce"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
        <div className="absolute -inset-4 border border-action-primary/10 rounded-[2.5rem] animate-ping opacity-20" />
      </div>

      {/* Message */}
      <div className="space-y-4 max-w-sm">
        <h3
          className="text-2xl font-bold tracking-tight text-white transition-all duration-700 animate-fade-in"
          key={msgIndex}
        >
          {messages[msgIndex]}
        </h3>
        {title && (
          <p className="text-text-muted text-sm leading-relaxed">{title}</p>
        )}
      </div>

      {/* Dot progress */}
      {messages.length > 1 && (
        <div className="flex gap-1.5">
          {messages.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i === msgIndex
                  ? "w-8 bg-action-primary"
                  : "w-2 bg-surface-border"
              }`}
            />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes loading-bar {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </Card>
  );
}

// ── Stages mode (doc generation) ───────────────────────────

function StagesLoader({
  title,
  stages,
  stageIntervalMs = 8000,
  className,
}: {
  title?: string;
  stages: DocStage[];
  stageIntervalMs?: number;
  className?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (activeIdx >= stages.length - 1) return;
    const t = setTimeout(
      () => setActiveIdx((p) => Math.min(p + 1, stages.length - 1)),
      stageIntervalMs
    );
    return () => clearTimeout(t);
  }, [activeIdx, stages.length, stageIntervalMs]);

  const pct = Math.round(((activeIdx + 1) / stages.length) * 100);

  return (
    <Card
      elevated
      className={`p-12 flex flex-col gap-8 animate-fade-in-scale min-h-[480px] overflow-hidden relative ${className}`}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-surface-border overflow-hidden pointer-events-none">
        <div
          className="h-full bg-action-primary transition-all duration-1000 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-text-faded">
            Generating Docs
          </span>
        </div>
        {title && (
          <p className="text-white font-semibold text-lg leading-tight">
            {title}
          </p>
        )}
      </div>

      {/* Stage checklist */}
      <div className="flex-1 space-y-2 overflow-hidden">
        {stages.map((stage, i) => {
          const done = i < activeIdx;
          const active = i === activeIdx;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                active
                  ? "bg-action-primary/10 border border-action-primary/20"
                  : done
                  ? "opacity-50"
                  : "opacity-30"
              }`}
            >
              {/* Status icon */}
              <div className="mt-0.5 shrink-0">
                {done ? (
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-green-400"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : active ? (
                  <div className="w-5 h-5 rounded-full border-2 border-action-primary/60 border-t-action-primary animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border border-white/10" />
                )}
              </div>

              {/* Label */}
              <div>
                <p
                  className={`text-sm font-medium leading-none ${
                    active ? "text-white" : done ? "text-text-muted" : "text-text-faded"
                  }`}
                >
                  {stage.label}
                </p>
                {stage.sublabel && active && (
                  <p className="text-xs text-text-muted mt-1">
                    {stage.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress footer */}
      <div className="flex items-center justify-between text-xs text-text-muted border-t border-white/5 pt-4">
        <span>{pct}% complete</span>
        <span>
          {activeIdx + 1} / {stages.length} pages
        </span>
      </div>
    </Card>
  );
}

// ── Public component ────────────────────────────────────────

export function EngagingLoader({
  messages = DEFAULT_LOADING_MESSAGES,
  title,
  className = "",
  stages,
  stageIntervalMs,
}: EngagingLoaderProps) {
  if (stages && stages.length > 0) {
    return (
      <StagesLoader
        title={title}
        stages={stages}
        stageIntervalMs={stageIntervalMs}
        className={className}
      />
    );
  }

  return (
    <SpinnerLoader messages={messages} title={title} className={className} />
  );
}
