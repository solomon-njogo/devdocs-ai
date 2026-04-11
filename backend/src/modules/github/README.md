# github

GitHub integration: OAuth, REST API for file operations, webhook handling.

## Scope

- OAuth flow for repo access
- File read/write via GitHub API (under /docs)
- Webhook verification and handling
- Conflict resolution utilities

## Dependencies

- **Depends on:** `shared` only
- **Do NOT import:** `ai-engine`, `doc-generator`, `db`

## Public API (index.ts)

```ts
createOrUpdateFile(repoId: string, path: string, content: string, token: string): Promise<void>
readFile(repoId: string, path: string, token: string): Promise<string>
listRepoFiles(repoId: string, token: string, branch?: string): Promise<RepoFileEntry[]>
getRepoMetadata(repoId: string, token: string): Promise<{ name: string; description: string }>
verifyWebhookSignature(payload: string, signature: string, secret: string): boolean
getAuthorizationUrl(state?: string): string
exchangeCodeForToken(code: string): Promise<string>
```

## Conventions

- OAuth logic in `oauth/`
- File ops in `files/`
- Webhooks in `webhooks/`
- Export only via `index.ts`
