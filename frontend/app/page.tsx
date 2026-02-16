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
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="border-b border-surface-border bg-bg-secondary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl font-semibold text-text-primary">DevDocs AI</h1>
          <div className="flex items-center gap-4">
            <UserMenu />
            <Link href="/onboarding">
              <Button variant="primary" size="md">
                Create new project
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-lg font-medium text-text-primary mb-4">Projects</h2>

        {error && (
          <div className="rounded-lg border border-semantic-error-text/50 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text mb-4">
            {error}
          </div>
        )}

        {!error && projects.length === 0 ? (
          <Card elevated className="text-center py-12">
            <p className="text-text-secondary mb-2">No projects yet.</p>
            <p className="text-text-muted text-sm mb-6">
              Create a new project to generate PRDs, user stories, and docs from an idea or existing repo.
            </p>
            <Link href="/onboarding">
              <Button variant="primary">Create new project</Button>
            </Link>
          </Card>
        ) : !error ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <li key={project.id}>
                <Card
                  elevated
                  className="h-full flex flex-col hover:border-action-primary/50 transition-colors cursor-pointer"
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
                  <span className="text-lg font-semibold text-text-primary block mb-2">
                    {project.name}
                  </span>
                  <div className="flex flex-col gap-2 flex-1 min-h-0">
                    <span className="inline-flex items-center text-xs font-medium text-text-muted bg-surface-hover px-2 py-0.5 rounded-badge w-fit">
                      {projectTypeLabel(project.type)}
                    </span>
                    {project.repoId && (
                      <a
                        href={`https://github.com/${project.repoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-action-primary hover:underline truncate"
                      >
                        {project.repoId}
                      </a>
                    )}
                    <p className="text-xs text-text-muted mt-auto">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t border-surface-border flex gap-2"
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
                          View on GitHub
                        </Button>
                      </a>
                    ) : (
                      <span className="text-text-muted text-sm flex items-center">Docs generated</span>
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
