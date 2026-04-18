# cie

Codebase Intelligence Engine: indexes a repository, extracts symbols, chunks code,
generates embeddings, and provides context retrieval for doc generation.

## Scope

- Walk a repository's files via GitHub REST API
- Detect languages, parse and extract symbols (best-effort without tree-sitter in MVP)
- Chunk source files semantically; compute content hashes
- Generate embeddings (via ai-engine) and persist chunks to `code_chunks`
- Semantic search / context assembly for the doc-generation pipeline

## Dependencies

- **Depends on:** `shared`, `db`, `github` (read-only file access), `ai-engine` (embeddings)
- **Do NOT import:** `doc-generator` (cie is lower-level; doc-generator orchestrates cie)

## Public API (index.ts)

```ts
indexRepository(projectId: string, token: string): Promise<IndexResult>
assembleContext(projectId: string, query: string): Promise<AssembledContext>
```

## Internal layout

- `ingestion/` — file walker, language detector
- `chunking/` — semantic chunker, content hashing
- `embedding/` — batch embed via ai-engine
- `storage/` — persist indexed_files / code_chunks / symbols / file_dependencies via db
- `retrieval/` — vector search + context assembly
- `generation/` — Diátaxis router, prompt templates, doc generator (Phase 4)

## Notes

- MVP uses simple regex-based symbol extraction instead of tree-sitter.
  Tree-sitter can be added later for richer AST parsing.
- Embedding model defaults to `text-embedding-3-small` (1536 dims).

## Performance tuning

Re-runs skip unchanged files via GitHub blob `file_sha` and unchanged chunks via
SHA-256 `content_hash`; doc regeneration skips pages whose composite
`source_sha` is unchanged. The first run still walks and embeds everything;
subsequent runs should be orders of magnitude faster.

Environment variables:

| Var | Default | Purpose |
|---|---|---|
| `CIE_FILE_BATCH_SIZE` | `15` | Files processed per parallel batch in `indexRepository`. Raise for faster indexing at the cost of memory and GitHub/embedding concurrency. |
| `DOC_GEN_CONCURRENCY` | `3` | Max concurrent `generateDocPage` calls during the Diátaxis generation phase. |
| `MAX_CHUNK_TOKENS` | `800` | Semantic chunker max tokens per chunk (~4 chars/token). |
| `CIE_MIN_CHUNK_SIMILARITY` | `0.5` | Minimum vector similarity for retrieval. |
| `CIE_MIN_CONTEXT_CHUNKS` | `3` | Minimum chunks required before context is considered sufficient. |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Embedding model name. |
