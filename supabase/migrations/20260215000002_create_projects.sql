-- First-class project entity; scoped by session_id for ownership.
-- Table matches backend Project: id, sessionId, name, description, type, repoId, features, requirements, createdAt, updatedAt.

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('new_idea', 'existing')),
  repo_id TEXT,
  features TEXT,
  requirements TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_session_id ON projects (session_id);
CREATE INDEX IF NOT EXISTS idx_projects_repo_id ON projects (repo_id);

COMMENT ON TABLE projects IS 'First-class project entity; name, description, features, requirements; scoped by session for ownership';
