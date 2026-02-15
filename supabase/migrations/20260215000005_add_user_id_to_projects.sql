-- Add user ownership to projects. Supabase Auth (auth.users) is the source of identity.
-- session_id kept for backward compatibility; new code uses user_id for ownership.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

ALTER TABLE projects
  ALTER COLUMN session_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);

COMMENT ON COLUMN projects.user_id IS 'Supabase Auth user id; projects are owned by user_id when set';