-- Backfill columns required by backend createProject when migration 20260215000007
-- did not complete (e.g. pgvector/pg_trgm unavailable or partial apply).
-- Safe to run on databases that already applied 000007 (IF NOT EXISTS).

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS repo_owner TEXT,
  ADD COLUMN IF NOT EXISTS repo_name TEXT,
  ADD COLUMN IF NOT EXISTS repo_branch TEXT NOT NULL DEFAULT 'main';

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug) WHERE slug IS NOT NULL;
