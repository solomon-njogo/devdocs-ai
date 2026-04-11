-- ============================================================
-- DevDocs AI — Full MVP Schema Migration
-- CIE tables, docs renderer tables, RPCs, RLS, triggers.
-- Run after existing migrations (000000–000006).
-- ============================================================

-- Prerequisites: pgvector and trigram extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── PROJECTS: add MVP columns ──────────────────────────────
-- Existing columns kept for backward compat (session_id, type, repo_id, features, requirements, description).
-- user_id already references auth.users from migration 000005.

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS repo_owner TEXT,
  ADD COLUMN IF NOT EXISTS repo_name TEXT,
  ADD COLUMN IF NOT EXISTS repo_branch TEXT NOT NULL DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS github_token TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT,
  ADD COLUMN IF NOT EXISTS cie_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS cie_indexed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cie_chunk_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cie_error TEXT,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Enforce slug uniqueness (will be populated on project create going forward)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug) WHERE slug IS NOT NULL;

-- cie_status check (applied as a loose check since column may have existing NULL rows)
ALTER TABLE projects
  DROP CONSTRAINT IF EXISTS projects_cie_status_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_cie_status_check
  CHECK (cie_status IS NULL OR cie_status IN ('pending','indexing','indexed','error'));

-- Backfill repo_owner / repo_name from existing repo_id ('owner/repo')
UPDATE projects
SET repo_owner = split_part(repo_id, '/', 1),
    repo_name  = split_part(repo_id, '/', 2)
WHERE repo_id IS NOT NULL
  AND repo_owner IS NULL
  AND position('/' in repo_id) > 0;

-- ── CIE: INDEXED FILES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS indexed_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT,
  file_sha TEXT NOT NULL,
  size_bytes INT,
  chunk_count INT DEFAULT 0,
  indexed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_indexed_files_project ON indexed_files(project_id);

-- ── CIE: CODE CHUNKS + VECTORS ───────────────────────────
CREATE TABLE IF NOT EXISTS code_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES indexed_files(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  language TEXT NOT NULL,
  chunk_type TEXT NOT NULL
    CHECK (chunk_type IN ('function','method','class','module','type','constant')),
  symbol_name TEXT,
  parent_symbol TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  start_line INT,
  end_line INT,
  token_count INT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_code_chunks_project ON code_chunks(project_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_file ON code_chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_embedding ON code_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ── CIE: SYMBOL INDEX ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS symbols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL
    CHECK (kind IN ('function','method','class','interface','type','enum','constant','variable')),
  parent_name TEXT,
  signature TEXT,
  docstring TEXT,
  start_line INT,
  end_line INT,
  is_exported BOOLEAN DEFAULT false,
  UNIQUE(project_id, file_path, name, kind)
);

CREATE INDEX IF NOT EXISTS idx_symbols_project_name ON symbols(project_id, name);
CREATE INDEX IF NOT EXISTS idx_symbols_name_trgm ON symbols USING GIN (name gin_trgm_ops);

-- ── CIE: DEPENDENCY GRAPH ─────────────────────────────────
CREATE TABLE IF NOT EXISTS file_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  from_file TEXT NOT NULL,
  to_file TEXT NOT NULL,
  import_names TEXT[],
  is_type_only BOOLEAN DEFAULT false,
  UNIQUE(project_id, from_file, to_file)
);

CREATE INDEX IF NOT EXISTS idx_file_deps_from ON file_dependencies(project_id, from_file);
CREATE INDEX IF NOT EXISTS idx_file_deps_to ON file_dependencies(project_id, to_file);

-- ── RENDERER: DOCS PAGES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS docs_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  layer TEXT NOT NULL
    CHECK (layer IN ('concept','quickstart','howto','reference')),
  is_auto BOOLEAN DEFAULT true,
  source_files TEXT[],
  source_sha TEXT,
  fts_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(content,''))
  ) STORED,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_docs_pages_project ON docs_pages(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_pages_layer ON docs_pages(project_id, layer);
CREATE INDEX IF NOT EXISTS idx_docs_pages_fts ON docs_pages USING GIN (fts_vector);
CREATE INDEX IF NOT EXISTS idx_docs_pages_embedding ON docs_pages
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION update_docs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS docs_pages_updated_at ON docs_pages;
CREATE TRIGGER docs_pages_updated_at BEFORE UPDATE ON docs_pages
FOR EACH ROW EXECUTE FUNCTION update_docs_updated_at();

-- ── RENDERER: NAV OVERRIDES ───────────────────────────────
CREATE TABLE IF NOT EXISTS docs_nav (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id)
);

-- ── SEARCH RPC: semantic search over docs ─────────────────
CREATE OR REPLACE FUNCTION search_docs(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 10
)
RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT, layer TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, slug, title, summary, layer,
         1 - (embedding <=> p_query_embedding) AS similarity
  FROM docs_pages
  WHERE project_id = p_project_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

-- ── SEARCH RPC: full-text search over docs ────────────────
CREATE OR REPLACE FUNCTION fts_docs(
  p_project_id UUID,
  p_query TEXT,
  p_match_count INT DEFAULT 10
)
RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT, layer TEXT, rank FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, slug, title, summary, layer,
         ts_rank(fts_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM docs_pages
  WHERE project_id = p_project_id
    AND fts_vector @@ websearch_to_tsquery('english', p_query)
  ORDER BY rank DESC
  LIMIT p_match_count;
$$;

-- ── SEARCH RPC: vector search over code_chunks ────────────
CREATE OR REPLACE FUNCTION match_code_chunks(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 20
)
RETURNS TABLE(id UUID, "filePath" TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, file_path AS "filePath", content,
         1 - (embedding <=> p_query_embedding) AS similarity
  FROM code_chunks
  WHERE project_id = p_project_id
    AND embedding IS NOT NULL
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE docs_nav ENABLE ROW LEVEL SECURITY;

-- Public can read public project docs
DROP POLICY IF EXISTS docs_public_read ON docs_pages;
CREATE POLICY docs_public_read ON docs_pages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_id AND p.is_public = true
));

-- Owners can do everything to their project docs
DROP POLICY IF EXISTS docs_owner_all ON docs_pages;
CREATE POLICY docs_owner_all ON docs_pages FOR ALL
USING (EXISTS (
  SELECT 1 FROM projects p
  WHERE p.id = project_id AND p.user_id = auth.uid()
));

-- Project owner policies
DROP POLICY IF EXISTS projects_owner ON projects;
CREATE POLICY projects_owner ON projects FOR ALL
USING (user_id = auth.uid());

-- Allow public to read public projects (for slug resolution in renderer)
DROP POLICY IF EXISTS projects_public_read ON projects;
CREATE POLICY projects_public_read ON projects FOR SELECT
USING (is_public = true);

-- CIE tables: owner only
DROP POLICY IF EXISTS chunks_owner ON code_chunks;
CREATE POLICY chunks_owner ON code_chunks FOR ALL
USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS indexed_files_owner ON indexed_files;
CREATE POLICY indexed_files_owner ON indexed_files FOR ALL
USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS symbols_owner ON symbols;
CREATE POLICY symbols_owner ON symbols FOR ALL
USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS file_deps_owner ON file_dependencies;
CREATE POLICY file_deps_owner ON file_dependencies FOR ALL
USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS docs_nav_owner ON docs_nav;
CREATE POLICY docs_nav_owner ON docs_nav FOR ALL
USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND p.user_id = auth.uid()));
