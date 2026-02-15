/**
 * Project and project-doc types.
 * Used by DB layer and API responses; project is the first-class entity.
 */

/** First-class project entity (DB + API). */
export interface Project {
  id: string;
  sessionId: string;
  name: string;
  description?: string | null;
  type: "new_idea" | "existing";
  repoId?: string | null;
  features?: string | null;
  requirements?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Generated doc linked to a project (stored in project_docs). */
export interface ProjectDoc {
  id: string;
  projectId: string;
  type: "prd" | "user_story" | "user_journey";
  path: string;
  content: string;
  createdAt: string;
}
