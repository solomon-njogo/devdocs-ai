-- Allow 'generating' as a valid cie_status value.
-- This represents the phase between indexing completion and docs generation completion.
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_cie_status_check;

ALTER TABLE projects
  ADD CONSTRAINT projects_cie_status_check
  CHECK (cie_status IS NULL OR cie_status IN ('pending', 'indexing', 'generating', 'indexed', 'error'));

-- Track how many doc pages the current pipeline run is generating.
-- Used by the frontend to render an accurate progress checklist.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS cie_docs_planned INT DEFAULT 0;
