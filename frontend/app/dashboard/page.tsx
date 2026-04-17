"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserMenu } from "@/components/UserMenu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getProjects, deleteProject, type Project, type ProjectType } from "@/lib/projects";
import { getIntegrationStatus, type AllIntegrationsStatus, getAuthGitHubUrl } from "@/lib/api";

const NAV_ITEMS = [
  { id: "all", label: "All Projects", icon: "🏠", href: "/dashboard" },
  { id: "recent", label: "Recently Viewed", icon: "🕒", href: "/dashboard?tab=recent" },
  { id: "starred", label: "Starred", icon: "⭐️", href: "/dashboard?tab=starred" },
  { id: "archived", label: "Archived", icon: "📦", href: "/dashboard?tab=archived" },
  { id: "prd-gen", label: "PRD Generator", icon: "✨", href: "/projects/prd-generator" },
];

function projectTypeLabel(type: ProjectType): string {
  return type === "new_idea" ? "New idea" : "Existing repo";
}

function projectTypeIcon(type: ProjectType) {
  if (type === "new_idea") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeTab = searchParams?.get("tab") || "all";
  const [searchQuery, setSearchQuery] = useState("");
  const [integrations, setIntegrations] = useState<AllIntegrationsStatus | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    getIntegrationStatus().then(setIntegrations).catch(console.error);
  }, []);

  const handleConnect = async (integration: string) => {
    if (integration === "GitHub") {
      try {
        const url = await getAuthGitHubUrl();
        window.location.assign(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start GitHub authentication.");
      }
    } else {
      router.push("/dashboard/integrations");
    }
  };

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

  const handleConfirmDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeleteSubmitting(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      setError(null);
      setProjectToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't delete the project. Please try again.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const filteredProjects = projects
    .filter((project: Project) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        project.name.toLowerCase().includes(query) ||
        (project.repoId?.toLowerCase().includes(query) ?? false) ||
        (project.description?.toLowerCase().includes(query) ?? false);

      if (!matchesSearch) return false;

      // Filter by tab
      if (activeTab === "all") return true;
      if (activeTab === "recent") return true; // We'll sort these below
      if (activeTab === "starred") return false; // Not implemented in DB yet
      if (activeTab === "archived") return false; // Not implemented in DB yet

      return true;
    })
    .sort((a: Project, b: Project) => {
      if (activeTab === "recent") {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      return 0;
    });

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
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <Dialog open={projectToDelete !== null} onOpenChange={(open) => !open && !deleteSubmitting && setProjectToDelete(null)}>
        <DialogContent className="border-border bg-card text-text-primary sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary">Delete project?</DialogTitle>
            <DialogDescription className="text-text-muted">
              {projectToDelete
                ? `This will permanently remove "${projectToDelete.name}" and its documentation. This cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-lg border-border bg-muted hover:bg-surface-hover"
              disabled={deleteSubmitting}
              onClick={() => setProjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground border-0"
              disabled={deleteSubmitting}
              onClick={handleConfirmDeleteProject}
            >
              {deleteSubmitting ? "Deleting…" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Background ambient effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-action-primary/5 blur-[120px] rounded-full translate-x-1/4 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-blue-500/5 blur-[100px] rounded-full -translate-x-1/4 translate-y-1/4" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-[50] border-b border-surface-border bg-surface-header backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-action-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight">DevDocs AI</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <div className="h-4 w-px bg-surface-border mx-2" />
              <div className="flex items-center gap-1 text-sm font-medium text-text-muted">
                <span>Personal Workspace</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                <span className="text-text-primary">Projects</span>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faded">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-64 bg-bg-secondary border border-surface-border rounded-lg pl-9 pr-9 text-xs text-text-primary placeholder:text-text-faded focus:outline-none focus:border-action-primary/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faded hover:text-text-primary transition-colors p-1"
                  aria-label="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1600px] mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-64 border-r border-surface-border py-8 px-4 hidden lg:block">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                  ? "bg-surface-hover text-action-primary"
                  : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          <div className="mt-12">
            <h3 className="px-3 text-[10px] font-bold text-text-faded uppercase tracking-widest mb-4">Integrations</h3>
            <div className="space-y-1">
              {[
                { name: "GitHub", connected: integrations?.github.connected },
                { name: "GitLab", connected: integrations?.gitlab.connected },
                { name: "Linear", connected: integrations?.linear.connected }
              ].map(integration => (
                <button
                  key={integration.name}
                  onClick={() => handleConnect(integration.name)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                >
                  <span>{integration.name}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${integration.connected ? "bg-action-success" : "bg-surface-border"}`}></div>
                </button>
              ))}
              <Link href="/dashboard/integrations">
                <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold text-text-faded hover:text-text-primary transition-colors uppercase tracking-wider mt-2 group">
                  Manage
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-text-primary mb-1">Projects</h2>
              <p className="text-text-muted">Manage your documentation pipeline</p>
            </div>
            <Link href="/onboarding">
              <Button variant="primary" size="md" className="rounded-full shadow-lg shadow-action-primary/10">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create Project
              </Button>
            </Link>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400 mb-8 max-w-2xl">
              {error}
            </div>
          )}

          {!error && projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-8 border border-dashed border-surface-border rounded-2xl bg-bg-secondary/50">
              <div className="w-16 h-16 rounded-2xl bg-action-primary/10 flex items-center justify-center mb-6 text-action-primary">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="11" x2="12" y2="17" /><line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Build your first project</h3>
              <p className="text-text-muted text-center max-w-sm mb-8">
                Connect your repository or start from scratch to generate high-quality PRDs and technical documentation.
              </p>
              <Link href="/onboarding">
                <Button variant="primary" size="lg" className="rounded-full">
                  Get Started
                </Button>
              </Link>
            </div>
          ) : !error ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProjects.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-surface-border rounded-2xl bg-bg-secondary/30">
                  <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4 text-text-faded">
                    {searchQuery ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    ) : activeTab === "starred" ? (
                      <span className="text-xl">⭐️</span>
                    ) : activeTab === "archived" ? (
                      <span className="text-xl">📦</span>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-1">
                    {searchQuery ? "No matches found" : activeTab === "starred" ? "No starred projects" : activeTab === "archived" ? "No archived projects" : "No projects found"}
                  </h3>
                  <p className="text-sm text-text-muted mb-6">
                    {searchQuery
                      ? `We couldn't find any projects matching "${searchQuery}"`
                      : activeTab === "starred"
                        ? "Projects you star will appear here for quick access."
                        : activeTab === "archived"
                          ? "Projects you archive will be stored here."
                          : "Try adjusting your filters or search."}
                  </p>
                  {searchQuery ? (
                    <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")} className="rounded-full">
                      Clear Search
                    </Button>
                  ) : activeTab !== "all" ? (
                    <Link href="/dashboard" className="px-4 py-2 bg-bg-secondary border border-surface-border rounded-full text-xs font-medium text-text-primary hover:bg-surface-hover transition-colors">
                      View All Projects
                    </Link>
                  ) : (
                    <Link href="/onboarding">
                      <Button variant="primary" size="sm" className="rounded-full">
                        Create Project
                      </Button>
                    </Link>
                  )}
                </div>
              )}
              {filteredProjects.map((project: Project, i: number) => (
                <div
                  key={project.id}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div
                    className="absolute top-2 right-2 z-20"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-bg-primary/80 text-text-muted backdrop-blur-sm transition-colors hover:border-surface-border hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary/50"
                          aria-label={`Open menu for ${project.name}`}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="12" cy="5" r="1.75" />
                            <circle cx="12" cy="12" r="1.75" />
                            <circle cx="12" cy="19" r="1.75" />
                          </svg>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="min-w-[10rem] border-border bg-popover text-popover-foreground shadow-xl"
                      >
                        <DropdownMenuItem
                          variant="destructive"
                          className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-300"
                          onSelect={() => setProjectToDelete(project)}
                        >
                          Delete project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Card
                    className="h-full flex flex-col p-0 overflow-hidden bg-card hover:bg-surface-hover/40 border-surface-border hover:border-surface-border transition-all duration-300 group shadow-lg"
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
                    {/* Visual representative header */}
                    <div className="h-32 bg-gradient-to-br from-bg-tertiary to-bg-secondary relative overflow-hidden flex items-center justify-center dark:from-bg-tertiary dark:to-bg-primary transition-colors duration-500">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 ${project.type === "new_idea"
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-action-primary/10 text-action-primary"
                        }`}>
                        {projectTypeIcon(project.type)}
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-action-primary/10 blur-2xl rounded-full"></div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-text-faded uppercase tracking-widest border border-surface-border px-2 py-0.5 rounded">
                          {projectTypeLabel(project.type)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-text-primary mb-2 group-hover:text-action-primary transition-colors truncate">
                        {project.name}
                      </h3>

                      {project.repoId ? (
                        <div className="flex items-center gap-2 text-xs text-text-muted hover:text-text-primary transition-colors mb-4 truncate">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                          </svg>
                          {project.repoId}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-text-muted mb-4 opacity-70">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                          </svg>
                          Draft Idea
                        </div>
                      )}

                      <div className="mt-auto pt-6 border-t border-surface-border flex items-center justify-between">
                        <span className="text-[11px] text-text-faded">
                          {new Date(project.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <div className="flex -space-x-1.5">
                          {[1, 2].map(n => (
                            <div key={n} className="w-6 h-6 rounded-full border border-bg-primary bg-bg-tertiary flex items-center justify-center text-[8px] font-bold">
                              {n === 1 ? "JS" : "AI"}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
              {/* Empty state add project card */}
              <Link href="/onboarding" className="group">
                <Card className="h-full flex flex-col items-center justify-center border-dashed border-surface-border bg-transparent hover:bg-surface-hover/30 hover:border-action-primary/30 transition-all p-8 text-center min-h-[300px]">
                  <div className="w-12 h-12 rounded-full border border-surface-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-action-primary/30 group-hover:text-action-primary transition-all">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-text-muted group-hover:text-text-primary">Add another project</span>
                </Card>
              </Link>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
