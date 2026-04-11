-- ============================================================
-- Retrieval hardening: similarity/rank thresholds for search RPCs.
-- ============================================================

CREATE OR REPLACE FUNCTION search_docs(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 10,
  p_min_similarity FLOAT DEFAULT 0.65
)
RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT, layer TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, slug, title, summary, layer,
         1 - (embedding <=> p_query_embedding) AS similarity
  FROM docs_pages
  WHERE project_id = p_project_id
    AND embedding IS NOT NULL
    AND (1 - (embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;

CREATE OR REPLACE FUNCTION fts_docs(
  p_project_id UUID,
  p_query TEXT,
  p_match_count INT DEFAULT 10,
  p_min_rank FLOAT DEFAULT 0.02
)
RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT, layer TEXT, rank FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, slug, title, summary, layer,
         ts_rank(fts_vector, websearch_to_tsquery('english', p_query)) AS rank
  FROM docs_pages
  WHERE project_id = p_project_id
    AND fts_vector @@ websearch_to_tsquery('english', p_query)
    AND ts_rank(fts_vector, websearch_to_tsquery('english', p_query)) >= p_min_rank
  ORDER BY rank DESC
  LIMIT p_match_count;
$$;

CREATE OR REPLACE FUNCTION match_code_chunks(
  p_project_id UUID,
  p_query_embedding vector(1536),
  p_match_count INT DEFAULT 20,
  p_min_similarity FLOAT DEFAULT 0.72
)
RETURNS TABLE(id UUID, "filePath" TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE AS $$
  SELECT id, file_path AS "filePath", content,
         1 - (embedding <=> p_query_embedding) AS similarity
  FROM code_chunks
  WHERE project_id = p_project_id
    AND embedding IS NOT NULL
    AND (1 - (embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY embedding <=> p_query_embedding
  LIMIT p_match_count;
$$;
