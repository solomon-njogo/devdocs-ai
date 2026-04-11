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
