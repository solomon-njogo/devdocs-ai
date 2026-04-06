/**
 * Project list and project detail from API. Used by dashboard, onboarding, and project page.
 */

import { api } from "@/lib/api";

export type ProjectType = "new_idea" | "existing";

export type CieStatus = "pending" | "indexing" | "indexed" | "error";

export interface Project {
  id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  type: ProjectType;
  repoId?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string;
  features?: string | null;
  requirements?: string | null;
  cieStatus?: CieStatus;
  cieIndexedAt?: string | null;
  cieChunkCount?: number;
  cieError?: string | null;
  isPublic?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ProjectDocType = "prd" | "user_story" | "user_journey";

export interface ProjectDoc {
  id: string;
  projectId: string;
  type: ProjectDocType;
  path: string;
  content: string;
  createdAt: string;
}

export interface ProjectWithDocs {
  project: Project;
  docs: ProjectDoc[];
}

/**
 * Fetches projects for the current session from the API.
 * Throws on network or server error.
 */
export async function getProjects(): Promise<Project[]> {
  const list = await api<Project[]>("/api/projects");
  return Array.isArray(list) ? list : [];
}

/**
 * Fetches a single project and its docs by id.
 * Throws on network or server error.
 */
export async function getProject(id: string): Promise<ProjectWithDocs> {
  return api<ProjectWithDocs>(`/api/projects/${id}`);
}

/**
 * Creates a new doc for a project.
 * Throws on network or server error.
 */
export async function createDoc(
  projectId: string,
  doc: { type: ProjectDocType; path: string; content: string }
): Promise<ProjectDoc> {
  return api<ProjectDoc>(`/api/projects/${projectId}/docs`, {
    method: "POST",
    body: doc,
  });
}

/**
 * Updates an existing doc. Only provided fields are updated.
 * Throws on network or server error.
 */
export async function updateDoc(
  projectId: string,
  docId: string,
  payload: { content?: string; path?: string; type?: ProjectDocType }
): Promise<ProjectDoc> {
  return api<ProjectDoc>(`/api/projects/${projectId}/docs/${docId}`, {
    method: "PATCH",
    body: payload,
  });
}

/**
 * Deletes a doc. Resolves when done; throws on network or server error.
 */
export async function deleteDoc(projectId: string, docId: string): Promise<void> {
  await api<unknown>(`/api/projects/${projectId}/docs/${docId}`, {
    method: "DELETE",
  });
}

/** Trigger CIE indexing for a project. */
export async function triggerIndex(projectId: string): Promise<{ message: string }> {
  return api<{ message: string }>(`/api/projects/${projectId}/index`, {
    method: "POST",
  });
}
