"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

export interface EngagingLoaderProps {
  messages?: string[];
  title?: string;
  className?: string;
}

const DEFAULT_LOADING_MESSAGES = [
  "Synthesizing your vision...",
  "Architecting system overview...",
  "Drafting technical specifications...",
  "Generating product requirements...",
  "Building your documentation suite...",
  "Finalizing blueprints...",
];

export function EngagingLoader({ messages = DEFAULT_LOADING_MESSAGES, title, className = "" }: EngagingLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <Card elevated className={`p-16 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in-scale min-h-[500px] overflow-hidden relative ${className}`}>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-border overflow-hidden">
          <div className="h-full bg-action-primary animate-[loading-bar_4s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="relative">
        <div className="w-24 h-24 rounded-3xl border-2 border-action-primary/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
          <div className="w-16 h-16 rounded-2xl bg-action-primary/10 animate-pulse flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-action-primary animate-bounce">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
        <div className="absolute -inset-4 border border-action-primary/10 rounded-[2.5rem] animate-ping opacity-20" />
      </div>

      <div className="space-y-4 max-w-sm">
        <h3 className="text-2xl font-bold tracking-tight text-white transition-all duration-700 animate-fade-in" key={msgIndex}>
          {messages[msgIndex]}
        </h3>
        {title && (
          <p className="text-text-muted text-sm leading-relaxed">
            {title}
          </p>
        )}
      </div>

      {messages.length > 1 && (
        <div className="flex gap-1.5">
          {messages.map((_, i) => (
            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === msgIndex ? "w-8 bg-action-primary" : "w-2 bg-surface-border"}`} />
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Card>
  );
}
