"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserMenu } from "@/components/UserMenu";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getProject, createDoc, updateDoc, deleteDoc, triggerIndex, type Project, type ProjectDoc, type ProjectDocType, type ProjectType, type CieStatus } from "@/lib/projects";

function projectTypeLabel(t: ProjectType) { return t === "new_idea" ? "New idea" : "Existing repo"; }
function docTypeLabel(t: ProjectDocType) { return t === "prd" ? "PRD" : t === "user_story" ? "User story" : "User journey"; }
const DOC_TYPES: { value: ProjectDocType; label: string }[] = [{ value: "prd", label: "PRD" }, { value: "user_story", label: "User story" }, { value: "user_journey", label: "User journey" }];

const sidebarItemBase = "w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all group flex items-center justify-between";

export default function ProjectDetailPage() {
  const params = useParams();
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

  const handleTriggerIndex = async () => {
    if (!id) return;
    setIndexing(true);
    try {
      await triggerIndex(id);
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
    if (!id || project?.cieStatus !== "indexing") {
      return;
    }

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
    }, 4000);

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
    <div className="min-h-screen bg-[#070708] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-muted">Loading project…</p>
      </div>
    </div>
  );

  if (error && !project) return (
    <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-red-400">{error}</p>
      <Link href="/dashboard"><Button variant="secondary">Back to Workspace</Button></Link>
    </div>
  );

  if (!project) return null;

  return (
    <div className="h-screen bg-[#070708] text-white flex flex-col overflow-hidden">
      {/* High-fidelity Toolbar/Header */}
      <header className="h-14 border-b border-white/5 bg-[#070708]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-faded uppercase tracking-widest">{project.name}</span>
            <div className={`w-2 h-2 rounded-full ${project.repoId ? "bg-action-success" : "bg-amber-500"} animate-pulse`} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* CIE status indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/5 text-[11px] font-medium text-text-muted">
            <div className={`w-2 h-2 rounded-full ${
              project.cieStatus === "indexed" ? "bg-green-500" :
              project.cieStatus === "indexing" ? "bg-yellow-500 animate-pulse" :
              project.cieStatus === "error" ? "bg-red-500" :
              "bg-gray-500"
            }`} />
            {project.cieStatus === "indexed" ? "Indexed" :
             project.cieStatus === "indexing" ? "Indexing..." :
             project.cieStatus === "error" ? "Index error" :
             "Not indexed"}
            {project.cieChunkCount ? ` (${project.cieChunkCount} chunks)` : ""}
          </div>

          {project.repoId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTriggerIndex}
              disabled={indexing || project.cieStatus === "indexing"}
              className="text-[10px]"
            >
              {indexing ? "Starting..." : "Reindex"}
            </Button>
          )}

          {project.slug && (
            <Link href={`/docs/${project.slug}`} target="_blank">
              <Button variant="primary" size="sm" className="rounded-full shadow-lg shadow-action-primary/10">
                View Docs
              </Button>
            </Link>
          )}

          <div className="h-4 w-px bg-white/10" />
          <UserMenu />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Modern Sidebar Explorer */}
        <aside className="w-72 border-r border-white/5 bg-[#09090b]/50 overflow-y-auto flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-[10px] font-bold text-text-faded uppercase tracking-widest">Explorer</span>
            <button
              onClick={() => setAddDocOpen(!addDocOpen)}
              className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/5 text-text-muted hover:text-white transition-colors"
              title="New file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-2 space-y-0.5">
            {addDocOpen && (
              <div className="mb-4 bg-white/5 rounded-lg p-3 border border-white/10 animate-fade-in">
                <form onSubmit={handleAddDoc} className="space-y-3">
                  <input
                    className="w-full bg-[#070708] border border-white/10 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-action-primary"
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
                className={`${sidebarItemBase} ${selectedDocId === doc.id ? "bg-action-primary/10 text-action-primary" : "text-text-muted hover:text-white hover:bg-white/5"}`}
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

          <div className="mt-auto p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center text-action-primary text-sm font-bold">✨</div>
              <div>
                <div className="text-[10px] font-bold text-white leading-none mb-1">AI Assistant</div>
                <div className="text-[9px] text-text-muted leading-none">Context active</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Editor Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#070708]">
          {!selectedDoc ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 text-2xl">📄</div>
              <h3 className="text-xl font-bold mb-2">Workspace initialized</h3>
              <p className="text-text-muted max-w-sm">Select a document from the explorer to view or edit your technical specifications.</p>
            </div>
          ) : (
            <>
              {/* Secondary Editor Tabs-like Header */}
              <div className="h-10 border-b border-white/5 px-6 flex items-center justify-between bg-[#09090b]/30">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-text-faded tracking-widest">{docTypeLabel(selectedDoc.type)}</span>
                  <span className="text-xs text-text-muted">/</span>
                  <span className="text-xs text-white">{selectedDoc.path}</span>
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
                      <button onClick={handleCancelEdit} className="text-[10px] font-bold uppercase text-text-muted hover:text-white transition-colors">Cancel</button>
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
                      <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-white/60 hover:text-white">Cancel</button>
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
                      <div className="prose prose-invert prose-emerald max-w-none prose-sm sm:prose-base">
                        <MarkdownRenderer content={selectedDoc.content} />
                      </div>
                    )}
                  </div>

                  {/* Scroll hint/shadow */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#070708] to-transparent pointer-events-none" />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
