/**
 * Onboarding and project-status API types.
 * Used by onboarding flow (new idea vs existing repo).
 */

/** User selection: new idea or existing project. */
export type ProjectStatus = "new_idea" | "existing";

/** Request body for submitting a new idea (no repo). */
export interface NewIdeaRequest {
  projectName: string;
  description: string;
  features?: string;
  requirements?: string;
  additionalInfo?: string;
  /** Optional: pasted proposal text or URL; file upload can be phase 2. */
  proposalText?: string;
}

/** Single generated doc in onboarding response. */
export interface GeneratedDocItem {
  type: "prd" | "user-story" | "user-journey" | "architecture" | "api";
  path: string;
  content: string;
}

/** Response after generating docs from a new idea. */
export interface NewIdeaResponse {
  projectName: string;
  docs: GeneratedDocItem[];
}

/** Request to review an existing repo and push generated docs. */
export interface ReviewRepoRequest {
  repoId: string;
}

/** Response after reviewing repo and pushing docs. */
export interface ReviewRepoResponse {
  repoId: string;
  paths: string[];
  summary: string;
}
