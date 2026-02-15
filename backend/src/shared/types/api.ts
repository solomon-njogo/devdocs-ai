/**
 * API request/response shapes.
 * Single source of truth for API contracts.
 */

export interface GeneratePRDRequest {
  repoId: string;
  input: string;
}

export interface GeneratePRDResponse {
  docId: string;
  content: string;
  path: string;
}

export interface ApiError {
  code: string;
  message: string;
}
