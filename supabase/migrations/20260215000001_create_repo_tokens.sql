-- GitHub OAuth tokens per repo (for webhook-triggered doc sync).
-- Store encrypted in production; consider vault or Supabase Vault for secrets.

CREATE TABLE IF NOT EXISTS repo_tokens (
  repo_id TEXT PRIMARY KEY,
  token TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE repo_tokens IS 'GitHub access tokens per repo for webhook sync (server-side only)';
