/**
 * GitHub API and webhook types.
 */

export interface GitHubWebhookPayload {
  action?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  pusher?: {
    name: string;
    email: string;
  };
  ref?: string;
  commits?: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
  }>;
}
