-- Repository metadata: last doc state per repo (used by webhook sync).
-- Table matches backend RepoMeta: id, repoId, lastDocState, updatedAt.

CREATE TABLE IF NOT EXISTS repo_meta (
  id TEXT PRIMARY KEY,
  repo_id TEXT NOT NULL UNIQUE,
  last_doc_state TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repo_meta_repo_id ON repo_meta (repo_id);

COMMENT ON TABLE repo_meta IS 'Repository metadata and last doc state for DevDocs AI sync';
