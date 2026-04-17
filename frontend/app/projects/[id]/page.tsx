"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserMenu } from "@/components/UserMenu";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { EngagingLoader, type DocStage } from "@/components/EngagingLoader";
import { getProject, createDoc, updateDoc, deleteDoc, triggerIndex, type Project, type ProjectDoc, type ProjectDocType, type ProjectType } from "@/lib/projects";

function projectTypeLabel(t: ProjectType) { return t === "new_idea" ? "New idea" : "Existing repo"; }
function docTypeLabel(t: ProjectDocType) { return t === "prd" ? "PRD" : t === "user_story" ? "User story" : "User journey"; }
const DOC_TYPES: { value: ProjectDocType; label: string }[] = [{ value: "prd", label: "PRD" }, { value: "user_story", label: "User story" }, { value: "user_journey", label: "User journey" }];

const sidebarItemBase = "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all group flex items-center justify-between";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const [project, setProject] = useState<Project | null>(null);
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editType, setEditType] = useState<ProjectDocType>("prd");
  const [saving, setSaving] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [newDocType, setNewDocType] = useState<ProjectDocType>("prd");
  const [newDocPath, setNewDocPath] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [addDocSaving, setAddDocSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [indexing, setIndexing] = useState(false);

  /** True once this visit has observed `generating` — used to open public docs after the full pipeline (not the brief `indexed` after chunk store). */
  const hasSeenGeneratingRef = useRef(false);

  const expectDocsStorageKey = id ? `devdocs_expect_docs_${id}` : null;

  const handleTriggerIndex = async () => {
    if (!id) return;
    setIndexing(true);
    try {
      await triggerIndex(id);
      if (typeof window !== "undefined" && expectDocsStorageKey) {
        sessionStorage.setItem(expectDocsStorageKey, "1");
      }
      await loadProject();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start indexing.");
    } finally {
      setIndexing(false);
    }
  };

  const loadProject = useCallback(async (options?: { silent?: boolean }) => {
    if (!id) return;
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await getProject(id);
      setProject(data.project);
      setDocs(data.docs);
      setSelectedDocId(cur => {
        if (!data.docs.length) return null;
        const ok = cur && data.docs.some(d => d.id === cur);
        return ok ? cur : data.docs[0].id;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => { loadProject(); }, [loadProject]);

  useEffect(() => {
    hasSeenGeneratingRef.current = false;
  }, [id]);

  // After doc generation (`generating`), open published docs when status becomes `indexed`.
  useEffect(() => {
    const curr = project?.cieStatus;
    const slug = project?.slug;
    if (!slug) return;

    const pendingFromIndex =
      typeof window !== "undefined" &&
      expectDocsStorageKey &&
      sessionStorage.getItem(expectDocsStorageKey) === "1";

    if (curr === "error") {
      hasSeenGeneratingRef.current = false;
      if (expectDocsStorageKey) sessionStorage.removeItem(expectDocsStorageKey);
      return;
    }
    if (curr === "generating") {
      hasSeenGeneratingRef.current = true;
      return;
    }
    if (curr === "indexed" && (hasSeenGeneratingRef.current || pendingFromIndex)) {
      hasSeenGeneratingRef.current = false;
      if (expectDocsStorageKey) sessionStorage.removeItem(expectDocsStorageKey);
      router.replace(`/docs/${slug}`);
    }
  }, [project?.cieStatus, project?.slug, router, expectDocsStorageKey]);

  useEffect(() => {
    const isRunning = project?.cieStatus === "indexing" || project?.cieStatus === "generating";
    if (!id || !isRunning) {
      return;
    }

    const pollMs = project?.cieStatus === "generating" ? 2000 : 4000;

    let inFlight = false;
    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await loadProject({ silent: true });
      } finally {
        inFlight = false;
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, pollMs);

    void poll();

    return () => {
      window.clearInterval(interval);
    };
  }, [id, project?.cieStatus, loadProject]);

  const selectedDoc = docs.find(d => d.id === selectedDocId);

  useEffect(() => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content);
      setEditPath(selectedDoc.path);
      setEditType(selectedDoc.type);
      setEditing(false);
    }
  }, [selectedDocId, docs]);

  const handleSaveEdit = async () => {
    if (!id || !selectedDoc) return;
    setSaving(true);
    setError(null);
    try {
      const u = await updateDoc(id, selectedDoc.id, { content: editContent, path: editPath, type: editType });
      setDocs(p => p.map(d => d.id === u.id ? u : d));
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content);
      setEditPath(selectedDoc.path);
      setEditType(selectedDoc.type);
    }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id || !selectedDocId) return;
    setSaving(true);
    setError(null);
    try {
      await deleteDoc(id, selectedDocId);
      setDocs(p => p.filter(d => d.id !== selectedDocId));
      const rem = docs.filter(d => d.id !== selectedDocId);
      setSelectedDocId(rem.length > 0 ? rem[0].id : null);
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newDocPath.trim()) return;
    setAddDocSaving(true);
    setError(null);
    try {
      const doc = await createDoc(id, { type: newDocType, path: newDocPath.trim(), content: newDocContent.trim() || "" });
      setDocs(p => [...p, doc]);
      setSelectedDocId(doc.id);
      setNewDocPath("");
      setNewDocContent("");
      setAddDocOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create document.");
    } finally {
      setAddDocSaving(false);
    }
  };

  if (loading && !project) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted">Loading project…</p>
      </div>
    </div>
  );

  if (error && !project) return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-red-400">{error}</p>
      <Link href="/dashboard"><Button variant="secondary">Back to Workspace</Button></Link>
    </div>
  );

  if (!project) return null;

  return (
    <div className="h-screen bg-bg-primary text-text-primary flex flex-col overflow-hidden">
      {/* Loading Overlay */}
      {(indexing || project.cieStatus === "indexing" || project.cieStatus === "generating" || addDocSaving) && (() => {
        // Build stage list for doc generation phase
        const docsPlanned = project.cieDocsPlanned ?? 0;
        const docStageLabels: Record<number, string[]> = {
          12: ["Overview","Architecture","Getting Started","Set Up Development","Write Tests","Deploy","Auth","Database","API","Environment","Modules","ADR: Frontend Framework"],
          18: ["Overview","Architecture","Getting Started","Set Up Development","Write Tests","Deploy","Auth","Database","API","Environment","Backend Module","Components Module","Hooks Module","Lib Module","Pages Module","Migrations Module","ADR: Frontend Framework","ADR: Database Strategy"],
        };
        const stages: DocStage[] = docsPlanned > 0
          ? (docStageLabels[docsPlanned] ?? Array.from({ length: docsPlanned }, (_, i) => ({ label: `Page ${i + 1} of ${docsPlanned}` })))
              .map((l) => (typeof l === "string" ? { label: l } : l))
          : [];

        return (
          <div className="fixed inset-0 z-[100] bg-bg-primary/90 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
            <div className="w-full max-w-2xl">
              <EngagingLoader
                title={
                  addDocSaving
                    ? "Generating new documentation from your request..."
                    : project.cieStatus === "generating"
                    ? `Writing ${docsPlanned > 0 ? docsPlanned : ""} documentation pages…`
                    : "Analyzing codebase and indexing documents..."
                }
                stages={project.cieStatus === "generating" && stages.length > 0 ? stages : undefined}
                stageIntervalMs={20000}
                messages={
                  addDocSaving ? [
                    "Synthesizing your requirements...",
                    "Architecting system overview...",
                    "Drafting technical specifications...",
                    "Finalizing document..."
                  ] : [
                    "Analyzing syntax trees...",
                    "Extracting dependencies...",
                    "Building vector index...",
                    "Discovering relations...",
                    "Synthesizing insights..."
                  ]
                }
                className="bg-card border-surface-border shadow-2xl"
              />
            </div>
          </div>
        );
      })()}

      {/* High-fidelity Toolbar/Header */}
      <header className="h-14 border-b border-surface-border bg-surface-header backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-bg-secondary flex items-center justify-center hover:bg-surface-hover transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-surface-border" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-faded uppercase tracking-widest">{project.name}</span>
            <div className={`w-2 h-2 rounded-full ${project.repoId ? "bg-action-success" : "bg-amber-500"} animate-pulse`} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* CIE status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-bg-secondary text-[11px] font-medium text-text-muted">
            <div className={`w-2 h-2 rounded-full ${
              project.cieStatus === "indexed" ? "bg-green-500" :
              project.cieStatus === "indexing" ? "bg-yellow-500 animate-pulse" :
              project.cieStatus === "generating" ? "bg-blue-400 animate-pulse" :
              project.cieStatus === "error" ? "bg-red-500" :
              "bg-gray-500"
            }`} />
            {project.cieStatus === "indexed" ? "Indexed" :
             project.cieStatus === "indexing" ? "Indexing..." :
             project.cieStatus === "generating" ? "Generating docs..." :
             project.cieStatus === "error" ? "Index error" :
             "Not indexed"}
            {project.cieChunkCount ? ` (${project.cieChunkCount} chunks)` : ""}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerIndex}
            disabled={indexing || project.cieStatus === "indexing" || project.cieStatus === "generating"}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={indexing ? "animate-spin" : ""}
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3" />
            </svg>
            {indexing ? "Starting…" : project.cieStatus === "indexing" ? "Indexing…" : "Index"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleTriggerIndex}
            disabled={indexing || project.cieStatus === "indexing" || project.cieStatus === "generating"}
            className="flex items-center gap-1.5 text-[11px] font-semibold"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={project.cieStatus === "generating" ? "animate-spin" : ""}
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 .49-3" />
            </svg>
            {project.cieStatus === "generating" ? "Generating…" : "Regenerate Docs"}
          </Button>

          {project.slug && (
            <Link href={`/docs/${project.slug}`} target="_blank">
              <Button variant="primary" size="sm" className="rounded-full shadow-lg shadow-action-primary/10">
                View Docs
              </Button>
            </Link>
          )}

          <div className="h-4 w-px bg-surface-border" />
          <UserMenu />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Modern Sidebar Explorer */}
        <aside className="w-72 border-r border-surface-border bg-bg-secondary/80 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-surface-border flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-faded uppercase tracking-widest">Explorer</span>
            <button
              onClick={() => setAddDocOpen(!addDocOpen)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
              title="New file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-2 space-y-0.5">
            {addDocOpen && (
              <div className="mb-4 bg-bg-tertiary rounded-lg p-3 border border-surface-border animate-fade-in">
                <form onSubmit={handleAddDoc} className="space-y-3">
                  <input
                    className="w-full bg-bg-primary border border-surface-border rounded px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-action-primary"
                    placeholder="file_path.md"
                    value={newDocPath}
                    onChange={e => setNewDocPath(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setAddDocOpen(false)} className="text-[10px] h-7">Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" disabled={addDocSaving} className="text-[10px] h-7">Create</Button>
                  </div>
                </form>
              </div>
            )}

            {docs.map(doc => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`${sidebarItemBase} ${selectedDocId === doc.id ? "bg-action-primary/10 text-action-primary" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`}
              >
                <div className="flex items-center gap-2 truncate">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                  </svg>
                  <span className="truncate">{doc.path}</span>
                </div>
                {selectedDocId === doc.id && <div className="w-1 h-1 rounded-full bg-action-primary" />}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-surface-border">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary border border-surface-border">
              <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center text-action-primary text-sm font-bold">✨</div>
              <div>
                <div className="text-[10px] font-bold text-text-primary leading-none mb-1">AI Assistant</div>
                <div className="text-[9px] text-text-muted leading-none">Context active</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Editor Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-bg-primary">
          {!selectedDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-bg-secondary flex items-center justify-center mb-6 text-2xl">📄</div>
              <h3 className="text-xl font-bold mb-2">Workspace initialized</h3>
              <p className="text-text-muted max-w-sm">Select a document from the explorer to view or edit your technical specifications.</p>
            </div>
          ) : (
            <>
              {/* Secondary Editor Tabs-like Header */}
              <div className="h-10 border-b border-surface-border px-6 flex items-center justify-between bg-bg-secondary/50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-faded tracking-widest">{docTypeLabel(selectedDoc.type)}</span>
                  <span className="text-xs text-text-muted">/</span>
                  <span className="text-xs text-text-primary">{selectedDoc.path}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!editing ? (
                    <>
                      <button onClick={() => setEditing(true)} className="text-[10px] font-bold uppercase text-action-primary hover:text-action-primary-hover transition-colors">Edit File</button>
                      <button onClick={() => setDeleteConfirmId(selectedDoc.id)} className="text-[10px] font-bold uppercase text-red-500 hover:text-red-400 transition-colors">Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleSaveEdit} disabled={saving} className="text-[10px] font-bold uppercase text-action-primary hover:text-action-primary-hover transition-colors">
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button onClick={handleCancelEdit} className="text-[10px] font-bold uppercase text-text-muted hover:text-text-primary transition-colors">Cancel</button>
                    </>
                  )}
                </div>
              </div>

              {/* Editor Surface */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {deleteConfirmId === selectedDoc.id && (
                  <div className="m-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between animate-in slide-in-from-top-4">
                    <span className="text-sm font-medium text-red-200">Delete {selectedDoc.path}? This cannot be undone.</span>
                    <div className="flex gap-4">
                      <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-text-muted hover:text-text-primary">Cancel</button>
                      <button onClick={handleDelete} className="text-xs font-bold text-red-400 hover:text-red-300">Confirm Delete</button>
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-10 py-10 relative">
                  <div className="max-w-4xl mx-auto">
                    {editing ? (
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-full bg-transparent border-none text-text-primary font-mono text-sm leading-relaxed focus:outline-none resize-none min-h-[500px]"
                        autoFocus
                      />
                    ) : (
                      <div className="prose prose-emerald dark:prose-invert max-w-none prose-sm sm:prose-base">
                        <MarkdownRenderer content={selectedDoc.content} />
                      </div>
                    )}
                  </div>

                  {/* Scroll hint/shadow */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
