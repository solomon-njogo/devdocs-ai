"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UserMenu } from "@/components/UserMenu";
import {
  getProject,
  createDoc,
  updateDoc,
  deleteDoc,
  type Project,
  type ProjectDoc,
  type ProjectDocType,
  type ProjectType,
} from "@/lib/projects";

function projectTypeLabel(type: ProjectType): string {
  return type === "new_idea" ? "New idea" : "Existing repo";
}

function docTypeLabel(type: ProjectDocType): string {
  if (type === "prd") return "PRD";
  if (type === "user_story") return "User story";
  return "User journey";
}

const DOC_TYPES: { value: ProjectDocType; label: string }[] = [
  { value: "prd", label: "PRD" },
  { value: "user_story", label: "User story" },
  { value: "user_journey", label: "User journey" },
];

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
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProject(id);
      setProject(data.project);
      setDocs(data.docs);
      setSelectedDocId((current) => {
        if (data.docs.length === 0) return null;
        const stillExists = current && data.docs.some((d) => d.id === current);
        return stillExists ? current : data.docs[0].id;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const selectedDoc = docs.find((d) => d.id === selectedDocId);

  useEffect(() => {
    if (selectedDoc) {
      setEditContent(selectedDoc.content);
      setEditPath(selectedDoc.path);
      setEditType(selectedDoc.type);
      setEditing(false);
    }
  }, [selectedDoc?.id]);

  const handleSaveEdit = async () => {
    if (!id || !selectedDoc) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateDoc(id, selectedDoc.id, {
        content: editContent,
        path: editPath,
        type: editType,
      });
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
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
      setDocs((prev) => prev.filter((d) => d.id !== selectedDocId));
      setSelectedDocId(null);
      const remaining = docs.filter((d) => d.id !== selectedDocId);
      if (remaining.length > 0) setSelectedDocId(remaining[0].id);
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
      const doc = await createDoc(id, {
        type: newDocType,
        path: newDocPath.trim(),
        content: newDocContent.trim() || "",
      });
      setDocs((prev) => [...prev, doc]);
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

  if (loading && !project) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-semantic-error-text">{error}</p>
        <Link href="/">
          <Button variant="secondary">Back to projects</Button>
        </Link>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <header className="border-b border-surface-border bg-bg-secondary shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <Link href="/" className="text-sm text-action-primary hover:underline mb-1 inline-block">
              ← Projects
            </Link>
            <h1 className="text-xl font-semibold text-text-primary truncate">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-text-muted mt-0.5 line-clamp-2">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center text-xs font-medium text-text-muted bg-surface-hover px-2 py-0.5 rounded-badge w-fit">
                {projectTypeLabel(project.type)}
              </span>
              {project.repoId && (
                <a
                  href={`https://github.com/${project.repoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-action-primary hover:underline"
                >
                  {project.repoId}
                </a>
              )}
            </div>
          </div>
          <UserMenu />
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="rounded-lg border border-semantic-error-text/50 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text">
            {error}
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col lg:flex-row max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6 min-h-0">
        {/* Doc list: sidebar on desktop, top on mobile */}
        <aside className="lg:w-64 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-text-secondary">Documents</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddDocOpen((o) => !o)}
            >
              {addDocOpen ? "Cancel" : "Add doc"}
            </Button>
          </div>
          {addDocOpen && (
            <Card elevated className="p-4">
              <form onSubmit={handleAddDoc} className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as ProjectDocType)}
                    className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-1.5 text-base"
                  >
                    {DOC_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Path"
                  value={newDocPath}
                  onChange={(e) => setNewDocPath(e.target.value)}
                  placeholder="e.g. docs/prd.md"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">Content</label>
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Document content…"
                    rows={4}
                    className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[100px]"
                  />
                </div>
                <Button type="submit" variant="primary" size="sm" disabled={addDocSaving}>
                  {addDocSaving ? "Creating…" : "Create"}
                </Button>
              </form>
            </Card>
          )}
          <nav className="flex flex-col gap-1 overflow-auto min-h-0">
            {docs.length === 0 && !addDocOpen ? (
              <p className="text-sm text-text-muted py-2">No documents yet. Add one above.</p>
            ) : (
              docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedDocId === doc.id
                      ? "bg-action-primary/15 text-action-primary font-medium"
                      : "hover:bg-surface-hover text-text-secondary"
                  }`}
                >
                  <span className="block truncate">{doc.path}</span>
                  <span className="text-xs text-text-muted">{docTypeLabel(doc.type)}</span>
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {!selectedDoc ? (
            <Card elevated className="flex-1 flex items-center justify-center p-8">
              <p className="text-text-muted text-center">
                {docs.length === 0
                  ? "Create a document to get started."
                  : "Select a document from the list."}
              </p>
            </Card>
          ) : (
            <Card elevated className="flex-1 flex flex-col min-h-0" title={selectedDoc.path}>
              <div className="flex flex-wrap gap-2 mb-3">
                {!editing ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteConfirmId(selectedDoc.id)}
                    >
                      Delete
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
              {deleteConfirmId === selectedDoc.id && (
                <div className="mb-3 p-3 rounded-lg border border-surface-border bg-surface-hover/50 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-text-secondary">Delete this document?</span>
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
                    Yes, delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(null)}>
                    Cancel
                  </Button>
                </div>
              )}
              {editing ? (
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Path</label>
                    <Input
                      value={editPath}
                      onChange={(e) => setEditPath(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Type</label>
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as ProjectDocType)}
                      className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-1.5 text-base"
                    >
                      {DOC_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <label className="block text-sm font-medium text-text-primary mb-1.5">Content</label>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="flex-1 w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[200px] font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <pre className="flex-1 overflow-auto p-0 m-0 text-sm text-text-primary whitespace-pre-wrap font-mono bg-bg-primary rounded-input p-3 min-h-[200px]">
                  {selectedDoc.content || "(empty)"}
                </pre>
              )}
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
