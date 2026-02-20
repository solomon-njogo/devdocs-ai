"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserMenu } from "@/components/UserMenu";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { getProject, createDoc, updateDoc, deleteDoc, type Project, type ProjectDoc, type ProjectDocType, type ProjectType } from "@/lib/projects";

function projectTypeLabel(t: ProjectType) { return t === "new_idea" ? "New idea" : "Existing repo"; }
function docTypeLabel(t: ProjectDocType) { return t === "prd" ? "PRD" : t === "user_story" ? "User story" : "User journey"; }
const DOC_TYPES: { value: ProjectDocType; label: string }[] = [{ value: "prd", label: "PRD" }, { value: "user_story", label: "User story" }, { value: "user_journey", label: "User journey" }];
const ta = "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-4 py-2.5 text-base placeholder:text-text-faded focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all duration-[var(--duration-normal)]";
const sel = "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all";

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

  const loadProject = useCallback(async () => {
    if (!id) return; setLoading(true); setError(null);
    try {
      const data = await getProject(id); setProject(data.project); setDocs(data.docs);
      setSelectedDocId(cur => { if (!data.docs.length) return null; const ok = cur && data.docs.some(d => d.id === cur); return ok ? cur : data.docs[0].id; });
    } catch (err) { setError(err instanceof Error ? err.message : "Failed to load project."); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { loadProject(); }, [loadProject]);
  const selectedDoc = docs.find(d => d.id === selectedDocId);
  useEffect(() => { if (selectedDoc) { setEditContent(selectedDoc.content); setEditPath(selectedDoc.path); setEditType(selectedDoc.type); setEditing(false); } }, [selectedDoc?.id]);

  const handleSaveEdit = async () => {
    if (!id || !selectedDoc) return; setSaving(true); setError(null);
    try { const u = await updateDoc(id, selectedDoc.id, { content: editContent, path: editPath, type: editType }); setDocs(p => p.map(d => d.id === u.id ? u : d)); setEditing(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to save."); } finally { setSaving(false); }
  };
  const handleCancelEdit = () => { if (selectedDoc) { setEditContent(selectedDoc.content); setEditPath(selectedDoc.path); setEditType(selectedDoc.type); } setEditing(false); };
  const handleDelete = async () => {
    if (!id || !selectedDocId) return; setSaving(true); setError(null);
    try { await deleteDoc(id, selectedDocId); setDocs(p => p.filter(d => d.id !== selectedDocId)); const rem = docs.filter(d => d.id !== selectedDocId); setSelectedDocId(rem.length > 0 ? rem[0].id : null); setDeleteConfirmId(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to delete."); } finally { setSaving(false); }
  };
  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault(); if (!id || !newDocPath.trim()) return; setAddDocSaving(true); setError(null);
    try { const doc = await createDoc(id, { type: newDocType, path: newDocPath.trim(), content: newDocContent.trim() || "" }); setDocs(p => [...p, doc]); setSelectedDocId(doc.id); setNewDocPath(""); setNewDocContent(""); setAddDocOpen(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Failed to create document."); } finally { setAddDocSaving(false); }
  };

  if (loading && !project) return <div className="min-h-screen bg-bg-primary flex items-center justify-center"><div className="flex items-center gap-3"><div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" /><p className="text-text-muted">Loading…</p></div></div>;
  if (error && !project) return <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center gap-4 px-4"><p className="text-semantic-error-text">{error}</p><Link href="/dashboard"><Button variant="secondary">Back to projects</Button></Link></div>;
  if (!project) return null;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-surface-border bg-surface-header backdrop-blur-xl shrink-0">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="min-w-0 flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-action-primary hover:text-action-primary-hover transition-colors flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Projects
            </Link>
            <div className="h-5 w-px bg-surface-border" />
            <h1 className="text-base font-semibold truncate">{project.name}</h1>
            <span className="hidden sm:inline-flex items-center text-xs font-medium text-text-muted bg-surface-hover px-2.5 py-1 rounded-badge">{projectTypeLabel(project.type)}</span>
            {project.repoId && <a href={`https://github.com/${project.repoId}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline text-sm text-action-primary hover:underline">{project.repoId}</a>}
          </div>
          <UserMenu />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-action-primary/50 to-transparent" />
      </header>

      {error && <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 pt-4"><div className="rounded-lg border border-semantic-error-text/30 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text">{error}</div></div>}

      <main className="flex-1 flex flex-col lg:flex-row max-w-7xl w-full mx-auto px-6 lg:px-8 py-6 gap-6 min-h-0">
        <aside className="lg:w-64 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text-secondary">Documents</h2>
            <Button variant="secondary" size="sm" onClick={() => setAddDocOpen(o => !o)}>{addDocOpen ? "Cancel" : "+ Add"}</Button>
          </div>
          {addDocOpen && (
            <Card elevated className="animate-fade-in-scale">
              <form onSubmit={handleAddDoc} className="flex flex-col gap-3">
                <div><label className="block text-sm font-medium mb-1.5">Type</label><select value={newDocType} onChange={e => setNewDocType(e.target.value as ProjectDocType)} className={sel}>{DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                <Input label="Path" value={newDocPath} onChange={e => setNewDocPath(e.target.value)} placeholder="e.g. docs/prd.md" required />
                <div><label className="block text-sm font-medium mb-1.5">Content</label><textarea value={newDocContent} onChange={e => setNewDocContent(e.target.value)} placeholder="Document content…" rows={4} className={`${ta} min-h-[100px]`} /></div>
                <Button type="submit" variant="primary" size="sm" disabled={addDocSaving}>{addDocSaving ? "Creating…" : "Create"}</Button>
              </form>
            </Card>
          )}
          <nav className="flex flex-col gap-1 overflow-auto min-h-0">
            {docs.length === 0 && !addDocOpen ? (
              <p className="text-sm text-text-muted py-4 text-center">No documents yet</p>
            ) : docs.map(doc => (
              <button key={doc.id} type="button" onClick={() => setSelectedDocId(doc.id)}
                className={`text-left px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer ${selectedDocId === doc.id ? "bg-action-primary/10 text-action-primary font-medium border border-action-primary/20" : "hover:bg-surface-hover text-text-secondary border border-transparent"}`}>
                <span className="block truncate">{doc.path}</span>
                <span className="text-xs text-text-muted">{docTypeLabel(doc.type)}</span>
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 flex flex-col">
          {!selectedDoc ? (
            <Card elevated className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-muted"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <p className="text-text-muted">{docs.length === 0 ? "Create a document to get started." : "Select a document from the list."}</p>
              </div>
            </Card>
          ) : (
            <Card elevated className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-action-primary shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                  <span className="font-semibold truncate">{selectedDoc.path}</span>
                  <span className="text-xs text-text-muted bg-surface-hover px-2 py-0.5 rounded-badge">{docTypeLabel(selectedDoc.type)}</span>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!editing ? (<>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={() => setDeleteConfirmId(selectedDoc.id)}>Delete</Button>
                  </>) : (<>
                    <Button variant="primary" size="sm" onClick={handleSaveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>Cancel</Button>
                  </>)}
                </div>
              </div>
              {deleteConfirmId === selectedDoc.id && (
                <div className="mb-3 p-3 rounded-lg border border-semantic-error-text/20 bg-semantic-error-bg/50 flex flex-wrap items-center gap-2 animate-fade-in">
                  <span className="text-sm text-text-secondary">Delete this document?</span>
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>Yes, delete</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                </div>
              )}
              {editing ? (
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Path" value={editPath} onChange={e => setEditPath(e.target.value)} />
                    <div><label className="block text-sm font-medium text-text-secondary mb-2">Type</label><select value={editType} onChange={e => setEditType(e.target.value as ProjectDocType)} className={sel}>{DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="block text-sm font-medium text-text-secondary mb-2">Content</label>
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className={`flex-1 ${ta} min-h-[200px] font-mono text-sm`} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto bg-bg-primary rounded-lg p-5 border border-surface-border min-h-[200px]">
                  <MarkdownRenderer content={selectedDoc.content} />
                </div>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
