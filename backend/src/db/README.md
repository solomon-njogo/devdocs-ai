# db

Data layer: Supabase for persistent state and metadata.

## Scope

- Supabase client setup (`client.ts`)
- CRUD for: projects, project_docs, repo_meta, repo_tokens
- CRUD for CIE tables: indexed_files, code_chunks, symbols, file_dependencies
- CRUD for renderer tables: docs_pages, docs_nav
- RPC wrappers: fts_docs, search_docs, match_code_chunks
- CIE status updates on projects

## Dependencies

- **Depends on:** `shared` only
- **Do NOT import:** `ai-engine`, `github`, `doc-generator`, `cie`

## Public API (index.ts)

```ts
// Projects
createProject, getProjectById, getProjectsByUserId, getProjectBySlug, updateCieStatus

// Legacy docs
insertProjectDocs, getDocsByProjectId, ...

// Docs pages (renderer)
upsertDocsPage, getDocsPagesByProject, getDocsPageBySlug, deleteDocsPagesByProject

// Docs nav
getDocsNav

// CIE
upsertIndexedFile, deleteIndexedFilesByProject
replaceChunksForFile, deleteChunksByProject
upsertSymbols, deleteSymbolsByProject
upsertFileDependencies, deleteFileDependenciesByProject

// Search
ftsSearchDocs, vectorSearchDocs, vectorSearchChunks
```
