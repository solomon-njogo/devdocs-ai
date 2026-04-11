"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-xl px-6 py-16">
          <p className="text-sm text-muted-foreground mb-2">Something went wrong</p>
          <h1 className="text-2xl font-semibold tracking-tight mb-3">DevDocs AI hit an unexpected error</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error?.message || "An unknown error occurred."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition"
          >
            Try again
          </button>
          {error?.digest && (
            <p className="mt-6 text-xs text-muted-foreground">Digest: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}

