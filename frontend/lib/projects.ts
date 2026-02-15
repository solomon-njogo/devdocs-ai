/**
 * Client-side project list (localStorage). Used by dashboard and onboarding.
 */

const STORAGE_KEY = "devdocs_projects";

export type ProjectType = "new_idea" | "existing";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  repoId?: string;
  createdAt: string;
}

function safeParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  const list = raw ? safeParse<Project[]>(raw, []) : [];
  return Array.isArray(list) ? list : [];
}

export function addProject(project: Omit<Project, "id" | "createdAt">): Project {
  const list = getProjects();
  const newProject: Project = {
    ...project,
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  list.unshift(newProject);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return newProject;
}

export function removeProject(id: string): void {
  const list = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
