-- Generated docs (PRD, user stories, user journeys) linked to a project.
-- One source of truth per project; every doc belongs to one project.

CREATE TABLE IF NOT EXISTS project_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prd', 'user_story', 'user_journey')),
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_docs_project_id ON project_docs (project_id);

COMMENT ON TABLE project_docs IS 'Generated docs (PRD, user stories, user journeys) linked to a project; one source of truth per project';
