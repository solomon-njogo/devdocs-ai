/**
 * GitHub Integration — OAuth, file ops, webhooks.
 * Public API for this module. See README.md for scope and dependencies.
 */

export { getAuthorizationUrl, exchangeCodeForToken } from "./oauth.js";
export { createOrUpdateFile, readFile, listRepoFiles, type RepoFileEntry } from "./files.js";
export { getRepoMetadata } from "./repos.js";
export { verifyWebhookSignature } from "./webhooks.js";
