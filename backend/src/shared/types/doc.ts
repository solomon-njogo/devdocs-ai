/**
 * Doc and metadata types.
 * Matches conceptual data model from README.
 */

export interface RepoMeta {
  id: string;
  repoId: string;
  lastDocState: string;
  updatedAt: string;
}

export interface DocItem {
  id: string;
  repoId: string;
  path: string;
  type: "prd" | "user-story" | "user-journey" | "architecture" | "api" | "changelog";
  version: string;
  source: string;
  content: string;
}

export interface AITrace {
  id: string;
  docId: string;
  promptVersion: string;
  model: string;
  createdAt: string;
}
