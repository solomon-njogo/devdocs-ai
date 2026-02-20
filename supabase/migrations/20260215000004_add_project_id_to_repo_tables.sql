-- Link repo_tokens and repo_meta to the project that owns the repo.
-- Repos are "under" a specific project; project_id makes that explicit.

ALTER TABLE repo_tokens
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_repo_tokens_project_id ON repo_tokens (project_id);

COMMENT ON COLUMN repo_tokens.project_id IS 'Project that owns this repo (for existing-repo onboarding)';

ALTER TABLE repo_meta
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_repo_meta_project_id ON repo_meta (project_id);

COMMENT ON COLUMN repo_meta.project_id IS 'Project that owns this repo';
