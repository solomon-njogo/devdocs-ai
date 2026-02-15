/**
 * Project list from API. Used by dashboard and onboarding.
 */

import { api } from "@/lib/api";

export type ProjectType = "new_idea" | "existing";

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  type: ProjectType;
  repoId?: string | null;
  features?: string | null;
  requirements?: string | null;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Fetches projects for the current session from the API.
 * Throws on network or server error.
 */
export async function getProjects(): Promise<Project[]> {
  const list = await api<Project[]>("/api/projects");
  return Array.isArray(list) ? list : [];
}
