"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserMenu } from "@/components/UserMenu";
import { getProjects, type Project, type ProjectType } from "@/lib/projects";

function projectTypeLabel(type: ProjectType): string {
  return type === "new_idea" ? "New idea" : "Existing repo";
}

function projectTypeIcon(type: ProjectType) {
  if (type === "new_idea") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load projects.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted">Loading projects…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-surface-border bg-surface-header backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <h1 className="text-lg font-bold gradient-text">DevDocs AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                New project
              </Button>
            </Link>
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-action-primary/50 to-transparent" />
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-text-primary">Projects</h2>
          <p className="text-text-muted mt-1">Manage your documentation projects</p>
        </div>

        {error && (
          <div className="rounded-lg border border-semantic-error-text/30 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {!error && projects.length === 0 ? (
          <div className="animate-fade-in">
            <Card elevated className="text-center py-16 px-8">
              <div className="max-w-sm mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-action-primary/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-action-primary">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No projects yet</h3>
                <p className="text-text-muted text-sm mb-8">
                  Create your first project to generate PRDs, user stories, and documentation from an idea or existing repo.
                </p>
                <Link href="/onboarding">
                  <Button variant="primary" size="lg">
                    Create your first project
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        ) : !error ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project, i) => (
              <li key={project.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                <Card
                  elevated
                  className="h-full flex flex-col group cursor-pointer hover:-translate-y-1 transition-all duration-[var(--duration-normal)]"
                  onClick={() => router.push(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/projects/${project.id}`);
                    }
                  }}
                >
                  {/* Card header with icon */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center text-action-primary shrink-0 group-hover:bg-action-primary/20 transition-colors">
                      {projectTypeIcon(project.type)}
                    </div>
                    <span className="inline-flex items-center text-xs font-medium text-text-muted bg-surface-hover px-2.5 py-1 rounded-badge">
                      {projectTypeLabel(project.type)}
                    </span>
                  </div>

                  {/* Project name */}
                  <h3 className="text-base font-semibold text-text-primary mb-1 group-hover:text-action-primary transition-colors">
                    {project.name}
                  </h3>

                  {/* Repo link */}
                  {project.repoId && (
                    <a
                      href={`https://github.com/${project.repoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm text-action-primary hover:underline truncate inline-block mb-2"
                    >
                      {project.repoId}
                    </a>
                  )}

                  {/* Date */}
                  <p className="text-xs text-text-faded mt-auto pt-2">
                    {new Date(project.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>

                  {/* Card footer */}
                  <div
                    className="mt-4 pt-4 border-t border-surface-border flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.repoId ? (
                      <a
                        href={`https://github.com/${project.repoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                      >
                        <Button variant="secondary" size="sm" className="w-full">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          View on GitHub
                        </Button>
                      </a>
                    ) : (
                      <span className="text-text-muted text-sm flex items-center gap-1.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-action-success">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Docs generated
                      </span>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}
