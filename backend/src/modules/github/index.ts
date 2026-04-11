/**
 * GitHub Integration — OAuth, file ops, webhooks.
 * Public API for this module. See README.md for scope and dependencies.
 */

export {
  getAuthorizationUrl,
  exchangeCodeForToken,
  isGitHubOAuthConfigured,
} from "./oauth.js";
export { createOrUpdateFile, readFile, listRepoFiles, type RepoFileEntry } from "./files.js";
export { getRepoMetadata, listUserRepositories, type UserRepoListItem } from "./repos.js";
export { verifyWebhookSignature } from "./webhooks.js";
