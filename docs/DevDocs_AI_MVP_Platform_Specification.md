**DevDocs AI**

**Full Platform MVP Specification**

CIE · Diátaxis Engine · Custom Docs Renderer · Supabase-only storage

+-----------------------------------------------------------------------+
|              |
+-----------------------------------------------------------------------+

**Part 1: What We Are Building --- Revised Product Vision**

+-----------------------------------------------------------------------+
| **MVP scope decision**                                                |
|                                                                       |
| Documentation is stored in Supabase only. No GitHub commits in v1.    |
| The CIE generates docs → writes to Supabase → the custom renderer     |
| reads from Supabase → serves the public docs site. GitHub sync is a   |
| v2 feature.                                                           |
+-----------------------------------------------------------------------+

The original proposal described DevDocs AI as a tool that generates
documentation and commits it to a GitHub /docs folder. The revised
architecture goes significantly further: DevDocs AI is now a full
documentation platform --- it generates docs, stores them, and renders
them on a public-facing website. This is the difference between being a
tool (like a code linter) and being a platform (like Mintlify itself).

**The three-layer platform:**

-   **Layer 1 --- The CIE:** reads your codebase, understands it
    semantically, and generates Diátaxis-shaped markdown. This is
    unchanged from the original design.

-   **Layer 2 --- The Diátaxis Engine:** a set of rules baked into the
    CIE\'s LLM prompts and document routing logic that ensures every
    generated document fits exactly one layer (concept, quickstart,
    how-to, or reference).

-   **Layer 3 --- The Custom Renderer:** a Next.js-powered docs site
    that reads from Supabase and presents the generated docs as a
    beautiful, searchable, public-facing website --- your own Mintlify.

**1.1 What the end product looks like for a user**

1.  Developer signs up on devdocsai.com and connects their GitHub
    repository via OAuth.

2.  DevDocs AI indexes the codebase (CIE pipeline --- unchanged from
    original design).

3.  DevDocs AI generates a full documentation suite (concept guides,
    quickstart, how-to guides, API reference) shaped by Diátaxis rules.

4.  All generated docs are stored in Supabase. No files are committed to
    GitHub.

5.  The developer visits their docs at
    devdocsai.com/docs/\[their-project-slug\] --- a fully rendered,
    searchable documentation site.

6.  On every code push, the CIE re-indexes changed files and updates the
    relevant docs in Supabase. The docs site reflects the change within
    minutes, automatically.

**1.2 What DevDocs AI is NOT in v1**

-   A GitHub bot that commits files to your repository

-   A documentation hosting service with custom domains (v2)

-   An AI chatbot over your docs (v2 --- but the vector index makes this
    trivial to add)

-   A Confluence or Notion replacement (different use case --- code
    documentation, not general wikis)

**Part 2: Complete System Architecture**

**2.1 Full data flow --- end to end**

> ┌─────────────────────────────────────────────────────────────────┐
>
> │ USER ACTIONS │
>
> │ Connect repo → Trigger index → View docs → Push code change │
>
> └───────────────────────────────┬─────────────────────────────────┘
>
> │
>
> ▼
>
> ┌─────────────────────────────────────────────────────────────────┐
>
> │ NEXT.JS APPLICATION │
>
> │ │
>
> │ ┌──────────────────┐ ┌─────────────────────────────────┐ │
>
> │ │ Dashboard UI │ │ API Routes (/api/\*) │ │
>
> │ │ (React / RSC) │ │ index-repo, webhook, search, │ │
>
> │ │ │ │ docs CRUD, nav, render │ │
>
> │ └──────────────────┘ └─────────────────────────────────┘ │
>
> │ │ │
>
> │ ┌─────────────────────────┤ │
>
> │ │ │ │
>
> │ ▼ ▼ │
>
> │ ┌──────────────────┐ ┌─────────────────────────────────┐ │
>
> │ │ CIE (indexing │ │ Docs Renderer (/docs/\*) │ │
>
> │ │ + generation) │ │ Nav engine, MDX renderer, │ │
>
> │ │ src/lib/cie/ │ │ search, public pages │ │
>
> │ └────────┬─────────┘ └──────────────┬──────────────────┘ │
>
> │ │ │ │
>
> └───────────┼─────────────────────────────┼───────────────────────┘
>
> │ │
>
> ▼ ▼
>
> ┌─────────────────────────────────────────────────────────────────┐
>
> │ SUPABASE │
>
> │ │
>
> │ code_chunks (pgvector) │ docs_pages │ symbols │ projects│
>
> │ indexed_files │ docs_nav │ file_deps│ users │
>
> └─────────────────────────────────────────────────────────────────┘
>
> │
>
> ▼
>
> ┌─────────────────────────────────────────────────────────────────┐
>
> │ EXTERNAL SERVICES │
>
> │ GitHub REST API (read repo) │ OpenRouter (LLM generation) │
>
> │ Inngest (background jobs) │ Embedding model API │
>
> └─────────────────────────────────────────────────────────────────┘

**2.2 Complete file structure**

> src/
>
> ├── lib/
>
> │ ├── cie/ ← Codebase Intelligence Engine
>
> │ │ ├── ingestion/
>
> │ │ │ ├── file-walker.ts
>
> │ │ │ ├── language-detector.ts
>
> │ │ │ └── gitignore-parser.ts
>
> │ │ ├── parsing/
>
> │ │ │ ├── ast-parser.ts ← Tree-sitter orchestrator
>
> │ │ │ ├── symbol-extractor.ts
>
> │ │ │ └── dependency-builder.ts
>
> │ │ ├── chunking/
>
> │ │ │ ├── semantic-chunker.ts
>
> │ │ │ └── chunk-types.ts
>
> │ │ ├── embedding/
>
> │ │ │ ├── embedder.ts
>
> │ │ │ └── batch-embedder.ts
>
> │ │ ├── storage/
>
> │ │ │ ├── chunk-store.ts ← pgvector upsert/delete
>
> │ │ │ └── symbol-index.ts
>
> │ │ ├── retrieval/
>
> │ │ │ ├── semantic-search.ts
>
> │ │ │ └── context-assembler.ts
>
> │ │ └── generation/
>
> │ │ ├── doc-generator.ts ← Orchestrates LLM calls
>
> │ │ ├── prompt-templates.ts
>
> │ │ └── diataxis-router.ts ← Decides which layer each doc is
>
> │ │
>
> │ ├── renderer/ ← Custom Mintlify (NEW)
>
> │ │ ├── nav-builder.ts ← Builds sidebar tree from docs_pages
>
> │ │ ├── mdx-renderer.tsx ← Markdown → styled React components
>
> │ │ ├── search-engine.ts ← FTS + vector search over docs
>
> │ │ └── docs-store.ts ← CRUD for docs_pages table
>
> │ │
>
> │ └── github/
>
> │ ├── oauth.ts
>
> │ ├── repo-fetcher.ts ← Reads files via Octokit
>
> │ └── webhook-handler.ts
>
> │
>
> ├── app/
>
> │ ├── (dashboard)/ ← Authenticated area
>
> │ │ ├── page.tsx ← Project list
>
> │ │ ├── projects/\[id\]/page.tsx ← Project detail + indexing status
>
> │ │ └── projects/\[id\]/docs/ ← Doc management UI
>
> │ │
>
> │ ├── docs/ ← PUBLIC docs renderer (custom Mintlify)
>
> │ │ ├── \[projectSlug\]/
>
> │ │ │ ├── layout.tsx ← Sidebar + header + search modal
>
> │ │ │ └── \[\...slug\]/
>
> │ │ │ └── page.tsx ← Single doc page
>
> │ │ └── \_components/
>
> │ │ ├── Sidebar.tsx
>
> │ │ ├── DocPage.tsx
>
> │ │ ├── SearchModal.tsx
>
> │ │ ├── MdxContent.tsx
>
> │ │ ├── TableOfContents.tsx
>
> │ │ └── LayerBadge.tsx ← Shows L1/L2/L3/L4 badge on every page
>
> │ │
>
> │ └── api/
>
> │ ├── index-repo/route.ts
>
> │ ├── index-status/\[id\]/route.ts
>
> │ ├── webhook/github/route.ts
>
> │ ├── docs/
>
> │ │ ├── search/route.ts ← Cmd+K search endpoint
>
> │ │ ├── nav/\[projectSlug\]/route.ts
>
> │ │ └── page/\[projectSlug\]/\[\...slug\]/route.ts
>
> │ └── generate/route.ts
>
> │
>
> ├── inngest/
>
> │ └── functions/
>
> │ ├── index-repository.ts
>
> │ ├── sync-diff.ts
>
> │ └── generate-docs.ts ← Calls doc-generator + writes to docs_pages
>
> │
>
> └── components/
>
> └── ui/ ← shadcn/ui components

**Part 3: Complete Supabase Database Schema (MVP)**

This is the single migration to run. It covers the CIE tables
(unchanged) plus the new docs renderer tables. Run this in your Supabase
SQL editor as a single migration file.

**3.1 Full migration --- copy-paste ready**

> sql
>
> \-- ============================================================
>
> \-- DevDocs AI --- Full MVP Schema Migration
>
> \-- Run once in Supabase SQL editor
>
> \-- ============================================================
>
> \-- Prerequisites
>
> CREATE EXTENSION IF NOT EXISTS vector;
>
> CREATE EXTENSION IF NOT EXISTS pg_trgm;
>
> \-- ── PROJECTS ──────────────────────────────────────────────
>
> CREATE TABLE projects (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
>
> name TEXT NOT NULL,
>
> slug TEXT NOT NULL UNIQUE, \-- used in /docs/\[slug\] URL
>
> repo_owner TEXT NOT NULL,
>
> repo_name TEXT NOT NULL,
>
> repo_branch TEXT NOT NULL DEFAULT \'main\',
>
> github_token TEXT, \-- encrypted via Supabase Vault
>
> webhook_secret TEXT, \-- encrypted via Supabase Vault
>
> cie_status TEXT DEFAULT \'pending\'
>
> CHECK (cie_status IN
> (\'pending\',\'indexing\',\'indexed\',\'error\')),
>
> cie_indexed_at TIMESTAMPTZ,
>
> cie_chunk_count INT DEFAULT 0,
>
> cie_error TEXT,
>
> is_public BOOLEAN DEFAULT true, \-- whether /docs/\[slug\] is publicly
> accessible
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX ON projects(owner_id);
>
> CREATE INDEX ON projects(slug);
>
> \-- ── CIE: INDEXED FILES ────────────────────────────────────
>
> CREATE TABLE indexed_files (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> file_path TEXT NOT NULL,
>
> language TEXT,
>
> file_sha TEXT NOT NULL,
>
> size_bytes INT,
>
> chunk_count INT DEFAULT 0,
>
> indexed_at TIMESTAMPTZ DEFAULT now(),
>
> UNIQUE(project_id, file_path)
>
> );
>
> CREATE INDEX ON indexed_files(project_id);
>
> \-- ── CIE: CODE CHUNKS + VECTORS ───────────────────────────
>
> CREATE TABLE code_chunks (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> file_id UUID REFERENCES indexed_files(id) ON DELETE CASCADE,
>
> file_path TEXT NOT NULL,
>
> language TEXT NOT NULL,
>
> chunk_type TEXT NOT NULL
>
> CHECK (chunk_type IN
> (\'function\',\'method\',\'class\',\'module\',\'type\',\'constant\')),
>
> symbol_name TEXT,
>
> parent_symbol TEXT,
>
> content TEXT NOT NULL,
>
> content_hash TEXT NOT NULL,
>
> start_line INT,
>
> end_line INT,
>
> token_count INT,
>
> embedding vector(1536),
>
> created_at TIMESTAMPTZ DEFAULT now()
>
> );
>
> CREATE INDEX ON code_chunks(project_id);
>
> CREATE INDEX ON code_chunks(file_id);
>
> CREATE INDEX ON code_chunks USING hnsw (embedding vector_cosine_ops)
>
> WITH (m = 16, ef_construction = 64);
>
> \-- ── CIE: SYMBOL INDEX ─────────────────────────────────────
>
> CREATE TABLE symbols (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> file_path TEXT NOT NULL,
>
> name TEXT NOT NULL,
>
> kind TEXT NOT NULL
>
> CHECK (kind IN
> (\'function\',\'method\',\'class\',\'interface\',\'type\',\'enum\',\'constant\',\'variable\')),
>
> parent_name TEXT,
>
> signature TEXT,
>
> docstring TEXT,
>
> start_line INT,
>
> end_line INT,
>
> is_exported BOOLEAN DEFAULT false,
>
> UNIQUE(project_id, file_path, name, kind)
>
> );
>
> CREATE INDEX ON symbols(project_id, name);
>
> CREATE INDEX ON symbols USING GIN (name gin_trgm_ops);
>
> \-- ── CIE: DEPENDENCY GRAPH ─────────────────────────────────
>
> CREATE TABLE file_dependencies (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> from_file TEXT NOT NULL,
>
> to_file TEXT NOT NULL,
>
> import_names TEXT\[\],
>
> is_type_only BOOLEAN DEFAULT false,
>
> UNIQUE(project_id, from_file, to_file)
>
> );
>
> CREATE INDEX ON file_dependencies(project_id, from_file);
>
> CREATE INDEX ON file_dependencies(project_id, to_file);
>
> \-- ── RENDERER: DOCS PAGES ──────────────────────────────────
>
> \-- This is the core table for the custom Mintlify renderer.
>
> \-- Every generated document lives here.
>
> CREATE TABLE docs_pages (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> \-- Routing
>
> slug TEXT NOT NULL, \-- e.g. \'api/index-repo\', \'getting-started\'
>
> title TEXT NOT NULL,
>
> \-- Content
>
> content TEXT NOT NULL, \-- raw markdown (MDX-compatible)
>
> summary TEXT, \-- 1-2 sentence summary for search results
>
> \-- Diátaxis layer classification
>
> layer TEXT NOT NULL
>
> CHECK (layer IN (\'concept\',\'quickstart\',\'howto\',\'reference\')),
>
> \-- Provenance
>
> is_auto BOOLEAN DEFAULT true, \-- CIE-generated vs manually written
>
> source_files TEXT\[\], \-- which codebase files this was generated
> from
>
> source_sha TEXT, \-- git SHA at time of generation
>
> \-- Search
>
> fts_vector tsvector GENERATED ALWAYS AS
>
> (to_tsvector(\'english\', coalesce(title,\'\') \|\| \' \' \|\|
> coalesce(summary,\'\') \|\| \' \' \|\| coalesce(content,\'\')))
> STORED,
>
> embedding vector(1536), \-- semantic search over doc content
>
> \-- Timestamps
>
> created_at TIMESTAMPTZ DEFAULT now(),
>
> updated_at TIMESTAMPTZ DEFAULT now(),
>
> UNIQUE(project_id, slug)
>
> );
>
> CREATE INDEX ON docs_pages(project_id);
>
> CREATE INDEX ON docs_pages(project_id, layer);
>
> CREATE INDEX ON docs_pages USING GIN (fts_vector);
>
> CREATE INDEX ON docs_pages USING hnsw (embedding vector_cosine_ops)
>
> WITH (m = 16, ef_construction = 64);
>
> \-- Auto-update updated_at on change
>
> CREATE OR REPLACE FUNCTION update_docs_updated_at()
>
> RETURNS TRIGGER LANGUAGE plpgsql AS \$\$
>
> BEGIN NEW.updated_at = now(); RETURN NEW; END; \$\$;
>
> CREATE TRIGGER docs_pages_updated_at BEFORE UPDATE ON docs_pages
>
> FOR EACH ROW EXECUTE FUNCTION update_docs_updated_at();
>
> \-- ── RENDERER: NAV OVERRIDES ───────────────────────────────
>
> \-- Allows project owners to reorder or rename nav items.
>
> \-- If no override exists, the renderer auto-builds nav from
> docs_pages.
>
> CREATE TABLE docs_nav (
>
> id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
>
> project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
>
> config JSONB NOT NULL, \-- { groups: \[{ label, slugs\[\], layer }\] }
>
> updated_at TIMESTAMPTZ DEFAULT now(),
>
> UNIQUE(project_id)
>
> );
>
> \-- ── SEARCH RPC: semantic search over docs ─────────────────
>
> CREATE OR REPLACE FUNCTION search_docs(
>
> p_project_id UUID,
>
> p_query_embedding vector(1536),
>
> p_match_count INT DEFAULT 10
>
> )
>
> RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT,
>
> layer TEXT, similarity FLOAT)
>
> LANGUAGE sql STABLE AS \$\$
>
> SELECT id, slug, title, summary, layer,
>
> 1 - (embedding \<=\> p_query_embedding) AS similarity
>
> FROM docs_pages
>
> WHERE project_id = p_project_id
>
> AND embedding IS NOT NULL
>
> ORDER BY embedding \<=\> p_query_embedding
>
> LIMIT p_match_count;
>
> \$\$;
>
> \-- ── SEARCH RPC: full-text search over docs ────────────────
>
> CREATE OR REPLACE FUNCTION fts_docs(
>
> p_project_id UUID,
>
> p_query TEXT,
>
> p_match_count INT DEFAULT 10
>
> )
>
> RETURNS TABLE(id UUID, slug TEXT, title TEXT, summary TEXT,
>
> layer TEXT, rank FLOAT)
>
> LANGUAGE sql STABLE AS \$\$
>
> SELECT id, slug, title, summary, layer,
>
> ts_rank(fts_vector, websearch_to_tsquery(\'english\', p_query)) AS
> rank
>
> FROM docs_pages
>
> WHERE project_id = p_project_id
>
> AND fts_vector @@ websearch_to_tsquery(\'english\', p_query)
>
> ORDER BY rank DESC
>
> LIMIT p_match_count;
>
> \$\$;
>
> \-- ── ROW LEVEL SECURITY ────────────────────────────────────
>
> ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
>
> ALTER TABLE docs_pages ENABLE ROW LEVEL SECURITY;
>
> ALTER TABLE indexed_files ENABLE ROW LEVEL SECURITY;
>
> ALTER TABLE code_chunks ENABLE ROW LEVEL SECURITY;
>
> ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;
>
> \-- Public can read public project docs
>
> CREATE POLICY docs_public_read ON docs_pages FOR SELECT
>
> USING (EXISTS (
>
> SELECT 1 FROM projects p
>
> WHERE p.id = project_id AND p.is_public = true
>
> ));
>
> \-- Owners can do everything to their project docs
>
> CREATE POLICY docs_owner_all ON docs_pages FOR ALL
>
> USING (EXISTS (
>
> SELECT 1 FROM projects p
>
> WHERE p.id = project_id AND p.owner_id = auth.uid()
>
> ));
>
> \-- Project owner policies (same pattern for all other tables)
>
> CREATE POLICY projects_owner ON projects FOR ALL
>
> USING (owner_id = auth.uid());
>
> CREATE POLICY chunks_owner ON code_chunks FOR ALL
>
> USING (EXISTS (SELECT 1 FROM projects p WHERE p.id = project_id AND
> p.owner_id = auth.uid()));

**Part 4: The Diátaxis Engine --- How the CIE Decides What to Generate**

The Diátaxis Engine is not a separate service. It is a module inside the
CIE that makes two decisions for every generation job: which document
type to produce, and what rules to enforce in the LLM prompt for that
type.

**4.1 The router --- src/lib/cie/generation/diataxis-router.ts**

> typescript
>
> export type DiátaxisLayer = \'concept\' \| \'quickstart\' \| \'howto\'
> \| \'reference\';
>
> export interface DocJob {
>
> projectId: string;
>
> layer: DiátaxisLayer;
>
> slug: string; // where it will live: \'api/sign-in\'
>
> title: string; // the document title
>
> sourceFiles: string\[\]; // which codebase files to pull context from
>
> focusQuery: string; // the query used for context assembly
>
> }
>
> /\*\*
>
> \* Given a freshly-indexed project, returns the full list of doc jobs
>
> \* the CIE should generate. One job = one row in docs_pages.
>
> \*/
>
> export async function planDocJobs(projectId: string):
> Promise\<DocJob\[\]\> {
>
> const jobs: DocJob\[\] = \[\];
>
> // ── CONCEPT: one ARCHITECTURE.md per project ──────────────
>
> jobs.push({
>
> projectId, layer: \'concept\',
>
> slug: \'architecture\', title: \'Architecture overview\',
>
> sourceFiles: \[\], // uses the full dependency graph
>
> focusQuery: \'system architecture modules dependencies design
> decisions\',
>
> });
>
> // ── QUICKSTART: one GETTING_STARTED per project ───────────
>
> jobs.push({
>
> projectId, layer: \'quickstart\',
>
> slug: \'getting-started\', title: \'Getting started\',
>
> sourceFiles: \[\'package.json\', \'README.md\', \'.env.example\'\],
>
> focusQuery: \'setup installation environment variables run
> development\',
>
> });
>
> // ── REFERENCE: one page per API route ─────────────────────
>
> const routes = await getApiRoutes(projectId);
>
> for (const route of routes) {
>
> jobs.push({
>
> projectId, layer: \'reference\',
>
> slug: \`api/\${route.slug}\`,
>
> title: \`\${route.method} \${route.path}\`,
>
> sourceFiles: \[route.filePath\],
>
> focusQuery: \`\${route.method} \${route.path} parameters response
> types\`,
>
> });
>
> }
>
> // ── REFERENCE: ENVIRONMENT.md ─────────────────────────────
>
> jobs.push({
>
> projectId, layer: \'reference\',
>
> slug: \'environment\', title: \'Environment variables\',
>
> sourceFiles: \[\],
>
> focusQuery: \'process.env environment variables configuration\',
>
> });
>
> // ── CONCEPT: one module guide per major module ────────────
>
> const modules = await getMajorModules(projectId);
>
> for (const mod of modules) {
>
> jobs.push({
>
> projectId, layer: \'concept\',
>
> slug: \`modules/\${mod.slug}\`,
>
> title: \`\${mod.name} module\`,
>
> sourceFiles: mod.files,
>
> focusQuery: \`\${mod.name} module what it does how it works\`,
>
> });
>
> }
>
> return jobs;
>
> }

**4.2 Layer-specific prompt rules ---
src/lib/cie/generation/prompt-templates.ts**

Each layer has a system prompt suffix that enforces the Diátaxis rules
for that layer. These are appended to every generation prompt.

> typescript
>
> export const LAYER_RULES: Record\<DiátaxisLayer, string\> = {
>
> concept: \`
>
> DOCUMENT TYPE: Concept guide (Diátaxis Layer 1).
>
> PURPOSE: Build the reader\'s mental model. Explain what and why.
>
> RULES:
>
> \- Write only prose. No numbered steps. No commands to run.
>
> \- No \'click here\', \'go to\', or \'run this command\' instructions.
>
> \- Code samples are illustrative only --- show shape, not runnable
> steps.
>
> \- End with a \'Related\' section linking to how-to guides and the
> reference.
>
> \- Target length: 400--900 words.
>
> \`,
>
> quickstart: \`
>
> DOCUMENT TYPE: Quickstart / Tutorial (Diátaxis Layer 2).
>
> PURPOSE: Get the reader to a working result in under 15 minutes.
>
> RULES:
>
> \- Every step must be numbered. One action per step.
>
> \- Every code block must be complete and runnable as-written.
>
> \- Make every decision for the reader --- no \'you can also\...\'
> options.
>
> \- No explanations of why things work. If you must, link to the
> concept guide.
>
> \- Include a \'Before you begin\' prerequisites section at the top.
>
> \- End with a \'What\'s next\' section with 3 links.
>
> \`,
>
> howto: \`
>
> DOCUMENT TYPE: How-to guide (Diátaxis Layer 3).
>
> PURPOSE: Help the reader accomplish one specific task.
>
> RULES:
>
> \- Title MUST start with \'How to\'.
>
> \- Exactly one goal per document. Never say \'and while you\'re
> here\...\'.
>
> \- Include a Prerequisites section. Be explicit about starting state.
>
> \- Steps are numbered. Each step is a single action.
>
> \- Include a Troubleshooting section with the 2-3 most common failure
> modes.
>
> \- End with Related guides --- links only, no inline explanation.
>
> \`,
>
> reference: \`
>
> DOCUMENT TYPE: API Reference (Diátaxis Layer 4).
>
> PURPOSE: Exhaustive, factual documentation. Every parameter, every
> response.
>
> RULES:
>
> \- No opinions, no explanations, no recommendations.
>
> \- Document every parameter with: name, type, required/optional,
> description.
>
> \- Document every response code with its body schema.
>
> \- Include a working curl example request.
>
> \- Include a realistic example response in JSON.
>
> \- If something is unclear from the code, write \[TODO: confirm\] ---
> never guess.
>
> \- Do NOT include a \'Getting started\' or \'Overview\' section.
>
> \`,
>
> };

**Part 5: The Custom Renderer --- Building Your Own Mintlify**

The renderer is a set of Next.js routes and React components that turn
the docs_pages table into a live, public-facing documentation site. This
is the Layer 3 of the platform.

**5.1 The docs layout --- src/app/docs/\[projectSlug\]/layout.tsx**

This is the outermost shell of every docs page: sidebar, header, search
modal. It is a React Server Component that fetches the nav tree on every
request.

> tsx
>
> import { NavTree } from \'./\_components/Sidebar\';
>
> import { SearchModal } from \'./\_components/SearchModal\';
>
> import { getNavTree } from \'@/lib/renderer/nav-builder\';
>
> import { notFound } from \'next/navigation\';
>
> import { supabase } from \'@/lib/supabase\';
>
> export default async function DocsLayout({
>
> children,
>
> params,
>
> }: {
>
> children: React.ReactNode;
>
> params: { projectSlug: string };
>
> }) {
>
> // Verify the project exists and is public
>
> const { data: project } = await supabase
>
> .from(\'projects\')
>
> .select(\'id, name, is_public\')
>
> .eq(\'slug\', params.projectSlug)
>
> .single();
>
> if (!project \|\| !project.is_public) notFound();
>
> // Build the sidebar nav tree
>
> const navTree = await getNavTree(project.id);
>
> return (
>
> \<div className=\'flex min-h-screen\'\>
>
> {/\* Left sidebar \*/}
>
> \<aside className=\'w-64 shrink-0 border-r px-4 py-6 sticky top-0
> h-screen overflow-y-auto\'\>
>
> \<div className=\'mb-6\'\>
>
> \<h1 className=\'font-semibold text-lg\'\>{project.name}\</h1\>
>
> \<p className=\'text-xs text-muted-foreground
> mt-1\'\>Documentation\</p\>
>
> \</div\>
>
> \<NavTree tree={navTree} projectSlug={params.projectSlug} /\>
>
> \</aside\>
>
> {/\* Main content \*/}
>
> \<div className=\'flex-1 min-w-0\'\>
>
> {/\* Top bar with search \*/}
>
> \<header className=\'border-b px-6 py-3 flex items-center
> justify-between sticky top-0 bg-background z-10\'\>
>
> \<SearchModal projectId={project.id} projectSlug={params.projectSlug}
> /\>
>
> \<kbd className=\'text-xs text-muted-foreground\'\>⌘K to
> search\</kbd\>
>
> \</header\>
>
> \<main className=\'px-8 py-8 max-w-3xl\'\>{children}\</main\>
>
> \</div\>
>
> \</div\>
>
> );
>
> }

**5.2 The nav builder --- src/lib/renderer/nav-builder.ts**

This is what replaces Mintlify\'s mint.json file. It auto-groups
documents by Diátaxis layer and returns a sidebar tree. No configuration
needed --- the layer is stored on every docs_pages row.

> typescript
>
> import { supabase } from \'@/lib/supabase\';
>
> export interface NavGroup {
>
> label: string;
>
> layer: string;
>
> items: { title: string; slug: string }\[\];
>
> }
>
> const LAYER_ORDER = \[\'quickstart\', \'concept\', \'howto\',
> \'reference\'\];
>
> const LAYER_LABELS: Record\<string, string\> = {
>
> quickstart: \'Getting started\',
>
> concept: \'Concepts\',
>
> howto: \'How-to guides\',
>
> reference: \'API reference\',
>
> };
>
> export async function getNavTree(projectId: string):
> Promise\<NavGroup\[\]\> {
>
> // Check if project owner has saved a custom nav config
>
> const { data: custom } = await supabase
>
> .from(\'docs_nav\').select(\'config\').eq(\'project_id\',
> projectId).single();
>
> if (custom?.config) return custom.config.groups;
>
> // Auto-build from docs_pages, grouped by layer
>
> const { data: pages } = await supabase
>
> .from(\'docs_pages\')
>
> .select(\'slug, title, layer\')
>
> .eq(\'project_id\', projectId)
>
> .order(\'created_at\', { ascending: true });
>
> if (!pages) return \[\];
>
> // Group by layer, maintain Diátaxis order
>
> const grouped = new Map\<string, { title: string; slug: string
> }\[\]\>();
>
> for (const page of pages) {
>
> if (!grouped.has(page.layer)) grouped.set(page.layer, \[\]);
>
> grouped.get(page.layer)!.push({ title: page.title, slug: page.slug });
>
> }
>
> return LAYER_ORDER
>
> .filter(layer =\> grouped.has(layer))
>
> .map(layer =\> ({
>
> label: LAYER_LABELS\[layer\],
>
> layer,
>
> items: grouped.get(layer)!,
>
> }));
>
> }

**5.3 The doc page ---
src/app/docs/\[projectSlug\]/\[\...slug\]/page.tsx**

> tsx
>
> import { MdxContent } from \'../\_components/MdxContent\';
>
> import { LayerBadge } from \'../\_components/LayerBadge\';
>
> import { TableOfContents } from \'../\_components/TableOfContents\';
>
> import { supabase } from \'@/lib/supabase\';
>
> import { notFound } from \'next/navigation\';
>
> export default async function DocPage({
>
> params,
>
> }: { params: { projectSlug: string; slug: string\[\] } }) {
>
> const slug = params.slug.join(\'/\');
>
> // Get the project id from slug
>
> const { data: project } = await supabase
>
> .from(\'projects\').select(\'id\').eq(\'slug\',
> params.projectSlug).single();
>
> if (!project) notFound();
>
> // Fetch the doc
>
> const { data: doc } = await supabase
>
> .from(\'docs_pages\')
>
> .select(\'title, content, layer, is_auto, updated_at, source_files\')
>
> .eq(\'project_id\', project.id)
>
> .eq(\'slug\', slug)
>
> .single();
>
> if (!doc) notFound();
>
> return (
>
> \<article\>
>
> {/\* Diátaxis layer badge --- tells reader what type of doc this is
> \*/}
>
> \<div className=\'flex items-center gap-3 mb-4\'\>
>
> \<LayerBadge layer={doc.layer} /\>
>
> {doc.is_auto && (
>
> \<span className=\'text-xs text-muted-foreground\'\>
>
> Auto-generated · Last updated {new
> Date(doc.updated_at).toLocaleDateString()}
>
> \</span\>
>
> )}
>
> \</div\>
>
> \<h1 className=\'text-3xl font-bold mb-6\'\>{doc.title}\</h1\>
>
> {/\* Table of contents (extracted from headings in markdown) \*/}
>
> \<TableOfContents content={doc.content} /\>
>
> {/\* The actual markdown content, rendered as React \*/}
>
> \<MdxContent source={doc.content} /\>
>
> \</article\>
>
> );
>
> }
>
> // Generate static params for all docs at build time (ISR)
>
> export async function generateStaticParams(
>
> { params }: { params: { projectSlug: string } }
>
> ) {
>
> const { data: project } = await supabase
>
> .from(\'projects\').select(\'id\').eq(\'slug\',
> params.projectSlug).single();
>
> if (!project) return \[\];
>
> const { data: pages } = await supabase
>
> .from(\'docs_pages\').select(\'slug\').eq(\'project_id\', project.id);
>
> return (pages ?? \[\]).map(p =\> ({ slug: p.slug.split(\'/\') }));
>
> }
>
> export const revalidate = 60; // revalidate every 60s (ISR)

**5.4 The MDX renderer --- src/app/docs/\_components/MdxContent.tsx**

This component takes raw markdown from the database and renders it as
styled React. Install: npm install next-mdx-remote shiki.

> tsx
>
> \'use client\';
>
> import { MDXRemote, MDXRemoteSerializeResult } from
> \'next-mdx-remote\';
>
> import { serialize } from \'next-mdx-remote/serialize\';
>
> import { useEffect, useState } from \'react\';
>
> import rehypeShiki from \'@shikijs/rehype\';
>
> import rehypeSlug from \'rehype-slug\';
>
> import rehypeAutolinkHeadings from \'rehype-autolink-headings\';
>
> // Custom components --- these replace default HTML elements
>
> const components = {
>
> // Code blocks with copy button
>
> pre: ({ children, \...props }: any) =\> (
>
> \<div className=\'relative group\'\>
>
> \<pre className=\'rounded-lg bg-muted p-4 overflow-x-auto text-sm\'
> {\...props}\>
>
> {children}
>
> \</pre\>
>
> \<CopyButton code={props\[\'data-raw\'\]} /\>
>
> \</div\>
>
> ),
>
> // Styled table
>
> table: (props: any) =\> (
>
> \<div className=\'overflow-x-auto my-4\'\>
>
> \<table className=\'w-full border-collapse text-sm\' {\...props} /\>
>
> \</div\>
>
> ),
>
> th: (props: any) =\> \<th className=\'border px-3 py-2 bg-muted
> text-left font-semibold\' {\...props} /\>,
>
> td: (props: any) =\> \<td className=\'border px-3 py-2\' {\...props}
> /\>,
>
> // Callout blocks from ::: syntax
>
> blockquote: (props: any) =\> (
>
> \<blockquote className=\'border-l-4 border-blue-400 bg-blue-50 px-4
> py-3 my-4 text-sm\' {\...props} /\>
>
> ),
>
> };
>
> export function MdxContent({ source }: { source: string }) {
>
> const \[mdx, setMdx\] = useState\<MDXRemoteSerializeResult \|
> null\>(null);
>
> useEffect(() =\> {
>
> serialize(source, {
>
> mdxOptions: {
>
> rehypePlugins: \[
>
> rehypeShiki,
>
> rehypeSlug,
>
> \[rehypeAutolinkHeadings, { behavior: \'wrap\' }\],
>
> \],
>
> },
>
> }).then(setMdx);
>
> }, \[source\]);
>
> if (!mdx) return \<div
> className=\'animate-pulse\'\>Loading\...\</div\>;
>
> return (
>
> \<div className=\'prose prose-slate max-w-none\'\>
>
> \<MDXRemote {\...mdx} components={components} /\>
>
> \</div\>
>
> );
>
> }

**5.5 The search endpoint --- src/app/api/docs/search/route.ts**

Cmd+K search that merges full-text and semantic results. Returns
instantly --- both RPCs are sub-100ms.

> typescript
>
> import { NextRequest, NextResponse } from \'next/server\';
>
> import { supabase } from \'@/lib/supabase\';
>
> import { embed } from \'@/lib/cie/embedding/embedder\';
>
> export async function GET(req: NextRequest) {
>
> const q = req.nextUrl.searchParams.get(\'q\') ?? \'\';
>
> const projectId = req.nextUrl.searchParams.get(\'project_id\') ??
> \'\';
>
> if (!q \|\| !projectId) return NextResponse.json({ results: \[\] });
>
> // Run FTS and semantic search in parallel
>
> const \[ftsResult, vecResult\] = await Promise.all(\[
>
> supabase.rpc(\'fts_docs\', {
>
> p_project_id: projectId,
>
> p_query: q,
>
> p_match_count: 8,
>
> }),
>
> embed(q).then(embedding =\> supabase.rpc(\'search_docs\', {
>
> p_project_id: projectId,
>
> p_query_embedding: embedding,
>
> p_match_count: 8,
>
> })),
>
> \]);
>
> // Merge and deduplicate by slug, FTS results first
>
> const seen = new Set\<string\>();
>
> const merged: SearchResult\[\] = \[\];
>
> for (const row of \[\...(ftsResult.data ?? \[\]), \...(vecResult.data
> ?? \[\])\]) {
>
> if (!seen.has(row.slug)) {
>
> seen.add(row.slug);
>
> merged.push(row);
>
> }
>
> }
>
> return NextResponse.json({ results: merged.slice(0, 10) });
>
> }

**Part 6: Generation Flow --- How CIE Writes to docs_pages**

This is the Inngest function that runs after every successful index. It
plans all doc jobs, generates each one, and upserts into docs_pages.
This is the bridge between the CIE and the renderer.

**6.1 The generate-docs Inngest function**

> typescript
>
> // inngest/functions/generate-docs.ts
>
> import { inngest } from \'@/lib/inngest\';
>
> import { planDocJobs } from \'@/lib/cie/generation/diataxis-router\';
>
> import { assembleContext } from
> \'@/lib/cie/retrieval/context-assembler\';
>
> import { LAYER_RULES } from \'@/lib/cie/generation/prompt-templates\';
>
> import { supabase } from \'@/lib/supabase\';
>
> import { embed } from \'@/lib/cie/embedding/embedder\';
>
> export const generateDocs = inngest.createFunction(
>
> { id: \'generate-docs\', concurrency: { limit: 3 } },
>
> { event: \'cie/indexed\' },
>
> async ({ event, step }) =\> {
>
> const { projectId } = event.data;
>
> // 1. Plan all doc jobs for this project
>
> const jobs = await step.run(\'plan-doc-jobs\', () =\>
>
> planDocJobs(projectId)
>
> );
>
> // 2. Generate each doc sequentially (rate-limit LLM calls)
>
> for (const job of jobs) {
>
> await step.run(\`generate-\${job.slug}\`, async () =\> {
>
> // Assemble context from CIE vector index
>
> const ctx = await assembleContext(projectId, job.focusQuery);
>
> // Build the prompt: context + layer rules
>
> const prompt = \[
>
> \`You are generating documentation for a software project.\`,
>
> \`Document to generate: \${job.title}\`,
>
> \`Slug: \${job.slug}\`,
>
> \`\`,
>
> LAYER_RULES\[job.layer\],
>
> \`\`,
>
> \`CODEBASE CONTEXT:\`,
>
> ctx.prompt,
>
> \].join(\'\\n\');
>
> // Call LLM via OpenRouter
>
> const response = await
> fetch(\'https://openrouter.ai/api/v1/chat/completions\', {
>
> method: \'POST\',
>
> headers: {
>
> \'Authorization\': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
>
> \'Content-Type\': \'application/json\',
>
> },
>
> body: JSON.stringify({
>
> model: \'anthropic/claude-sonnet-4-6\',
>
> messages: \[{ role: \'user\', content: prompt }\],
>
> max_tokens: 4000,
>
> }),
>
> });
>
> const data = await response.json();
>
> const content = data.choices\[0\].message.content as string;
>
> // Generate embedding for the doc (for search)
>
> const docEmbedding = await embed(job.title + \' \' + content.slice(0,
> 500));
>
> // Extract a 1-sentence summary (first non-empty paragraph)
>
> const summary = content.split(\'\\n\').find(l =\> l.trim().length \>
> 40) ?? \'\';
>
> // Upsert into docs_pages
>
> await supabase.from(\'docs_pages\').upsert({
>
> project_id: projectId,
>
> slug: job.slug,
>
> title: job.title,
>
> content,
>
> summary: summary.slice(0, 300),
>
> layer: job.layer,
>
> is_auto: true,
>
> source_files: job.sourceFiles,
>
> embedding: docEmbedding,
>
> }, { onConflict: \'project_id,slug\' });
>
> });
>
> }
>
> return { generated: jobs.length };
>
> }
>
> );

**Part 7: What the Public Docs Site Looks Like (UI Spec)**

This is the UI specification for the renderer --- what a developer
visiting your docs site sees. Every component listed here maps to a file
in src/app/docs/\_components/.

**7.1 Page structure**

  -----------------------------------------------------------------------
  **Area**            **Content**
  ------------------- ---------------------------------------------------
  Top bar             Project name · Search bar (Cmd+K) · Link to the
                      project\'s GitHub repo

  Left sidebar        Auto-grouped nav: Getting started → Concepts →
                      How-to guides → API reference. Active page
                      highlighted.

  Right sidebar       Table of contents from headings on the current
                      page. Scrolls with the reader.

  Page header         Diátaxis layer badge (colour-coded) +
                      \'Auto-generated · Last updated \[date\]\' label.

  Body                MDX-rendered markdown. Code blocks have syntax
                      highlighting + copy button. Tables are styled.

  Footer              Prev / Next doc navigation arrows, pulled from the
                      nav order.
  -----------------------------------------------------------------------

**7.2 The LayerBadge component**

Every doc page shows a colour-coded badge identifying its Diátaxis
layer. This is the design spec for that badge:

  ------------------------------------------------------------------------
  **Layer**       **Badge       **Text**
                  colour**      
  --------------- ------------- ------------------------------------------
  concept         Blue          Concept guide
                  (#DEEAF1)     

  quickstart      Green         Quickstart
                  (#E8F5E9)     

  howto           Purple        How-to guide
                  (#EEEDFE)     

  reference       Amber         API reference
                  (#FFF3CD)     
  ------------------------------------------------------------------------

> tsx
>
> export function LayerBadge({ layer }: { layer: string }) {
>
> const config = {
>
> concept: { label: \'Concept guide\', bg: \'bg-blue-100\', text:
> \'text-blue-800\' },
>
> quickstart: { label: \'Quickstart\', bg: \'bg-green-100\', text:
> \'text-green-800\' },
>
> howto: { label: \'How-to guide\', bg: \'bg-purple-100\', text:
> \'text-purple-800\' },
>
> reference: { label: \'API reference\', bg: \'bg-amber-100\', text:
> \'text-amber-800\' },
>
> }\[layer\] ?? { label: layer, bg: \'bg-gray-100\', text:
> \'text-gray-800\' };
>
> return (
>
> \<span className={\`inline-flex items-center px-2.5 py-0.5
> rounded-full
>
> text-xs font-medium \${config.bg} \${config.text}\`}\>
>
> {config.label}
>
> \</span\>
>
> );
>
> }

**7.3 Search modal --- Cmd+K**

The search modal queries the search endpoint and renders results grouped
by Diátaxis layer. Results show: title, layer badge, and the first
sentence of the summary.

> tsx
>
> \'use client\';
>
> import { useState, useEffect, useCallback } from \'react\';
>
> import { Dialog } from \'@/components/ui/dialog\';
>
> import { LayerBadge } from \'./LayerBadge\';
>
> export function SearchModal({ projectId, projectSlug }) {
>
> const \[open, setOpen\] = useState(false);
>
> const \[query, setQuery\] = useState(\'\');
>
> const \[results, setResults\] = useState(\[\]);
>
> // Open on Cmd+K
>
> useEffect(() =\> {
>
> const handler = (e: KeyboardEvent) =\> {
>
> if ((e.metaKey \|\| e.ctrlKey) && e.key === \'k\') {
>
> e.preventDefault(); setOpen(true);
>
> }
>
> };
>
> window.addEventListener(\'keydown\', handler);
>
> return () =\> window.removeEventListener(\'keydown\', handler);
>
> }, \[\]);
>
> // Debounced search
>
> useEffect(() =\> {
>
> if (!query) return setResults(\[\]);
>
> const timer = setTimeout(async () =\> {
>
> const res = await fetch(
>
> \`/api/docs/search?q=\${encodeURIComponent(query)}&project_id=\${projectId}\`
>
> );
>
> const { results } = await res.json();
>
> setResults(results);
>
> }, 200);
>
> return () =\> clearTimeout(timer);
>
> }, \[query, projectId\]);
>
> return (
>
> \<\>
>
> \<button onClick={() =\> setOpen(true)}
>
> className=\'flex items-center gap-2 text-sm text-muted-foreground
> border rounded-md px-3 py-1.5 hover:bg-muted w-48\'\>
>
> \<span\>Search docs\</span\>
>
> \<kbd className=\'ml-auto text-xs\'\>⌘K\</kbd\>
>
> \</button\>
>
> \<Dialog open={open} onOpenChange={setOpen}\>
>
> \<input autoFocus placeholder=\'Search documentation\...\'
>
> value={query} onChange={e =\> setQuery(e.target.value)}
>
> className=\'w-full px-4 py-3 text-sm border-b outline-none\' /\>
>
> \<div className=\'max-h-80 overflow-y-auto\'\>
>
> {results.map((r: any) =\> (
>
> \<a key={r.slug}
>
> href={\`/docs/\${projectSlug}/\${r.slug}\`}
>
> onClick={() =\> setOpen(false)}
>
> className=\'flex items-start gap-3 px-4 py-3 hover:bg-muted\'\>
>
> \<LayerBadge layer={r.layer} /\>
>
> \<div\>
>
> \<div className=\'font-medium text-sm\'\>{r.title}\</div\>
>
> \<div className=\'text-xs text-muted-foreground line-clamp-1\'\>
>
> {r.summary}\</div\>
>
> \</div\>
>
> \</a\>
>
> ))}
>
> \</div\>
>
> \</Dialog\>
>
> \</\>
>
> );
>
> }

**Part 8: Revised Build Phases --- Full 12-Week Plan**

+-----------------------------------------------------------------------+
| **Scope update**                                                      |
|                                                                       |
| The original proposal covered weeks 1--12 ending with a GitHub        |
| commit-based system. This revised plan delivers the same CIE (Phases  |
| 1--3) plus the custom renderer (Phases 4--5) within the same 12-week  |
| window, made possible by dropping GitHub write-back entirely and      |
| using Supabase as the only storage.                                   |
+-----------------------------------------------------------------------+

  --------- ------------------------------------------------- ------------
  **P1**    **Foundation --- Database, auth, GitHub read      Weeks 1--2
            access**                                          

  --------- ------------------------------------------------- ------------

-   Run the full Supabase migration from Part 3. Verify all tables,
    indexes, and RLS policies.

-   Set up GitHub OAuth using Supabase Auth. Store tokens via
    supabase.auth.signInWithOAuth({ provider: \'github\' }).

-   Implement repo-fetcher.ts: list repos, fetch file content by path
    using Octokit. Test on a real repo.

-   Build the projects table CRUD: create project, store slug, connect
    to GitHub repo.

-   Build the basic dashboard UI: project list, create project form,
    connect GitHub repo.

  --------- ------------------------------------------------- ------------
  **P2**    **CIE --- Index, embed, store chunks**            Weeks 3--4

  --------- ------------------------------------------------- ------------

-   Install Tree-sitter: npm install tree-sitter tree-sitter-typescript.
    Implement ast-parser.ts and symbol-extractor.ts.

-   Implement semantic-chunker.ts. Unit test: chunk a 200-line TS file,
    verify no function is split.

-   Implement batch-embedder.ts calling text-embedding-3-small via
    OpenRouter. Test on 50 chunks.

-   Implement chunk-store.ts: upsert chunks into code_chunks, update
    indexed_files.

-   Wire into index-repository Inngest function. End-to-end test:
    trigger index, verify chunks in Supabase with non-null embeddings.

-   Build index-status API route and the progress UI on the project
    detail page.

  --------- ------------------------------------------------- ------------
  **P3**    **CIE --- Context assembly + doc generation**     Weeks 5--6

  --------- ------------------------------------------------- ------------

-   Implement semantic-search.ts (calls search_docs RPC) and
    context-assembler.ts (rank + fit to window).

-   Implement diataxis-router.ts (planDocJobs) and prompt-templates.ts
    (LAYER_RULES).

-   Implement doc-generator.ts: takes a DocJob, assembles context, calls
    LLM, returns markdown.

-   Implement the generate-docs Inngest function from Part 6. Wire:
    after index completes → fire cie/indexed event → generate-docs runs.

-   End-to-end test: connect a real repo, index it, trigger generation,
    verify docs_pages rows appear in Supabase with content and correct
    layer assignments.

  --------- ------------------------------------------------- ------------
  **P4**    **Renderer --- Nav, MDX, doc pages**              Weeks 7--9

  --------- ------------------------------------------------- ------------

-   Implement nav-builder.ts (getNavTree). Unit test: create 6
    docs_pages rows across 3 layers, verify getNavTree returns the
    correct grouped structure.

-   Implement the docs layout: src/app/docs/\[projectSlug\]/layout.tsx.
    Test: visit /docs/test-project, verify sidebar renders with correct
    groups.

-   Implement MdxContent.tsx with rehype-shiki syntax highlighting and
    rehype-slug.

-   Implement LayerBadge.tsx, TableOfContents.tsx (extract headings from
    markdown with regex).

-   Implement the doc page:
    src/app/docs/\[projectSlug\]/\[\...slug\]/page.tsx. Test: visit
    /docs/test-project/getting-started, verify the doc renders.

-   Implement the search endpoint (Part 5.5) and SearchModal.tsx (Part
    7.3). Test: Cmd+K, type a query, verify results.

-   Add Prev/Next navigation to the doc page footer (query adjacent
    slugs from nav order).

  --------- ------------------------------------------------- ------------
  **P5**    **Sync, polish, deploy**                          Weeks 10--12

  --------- ------------------------------------------------- ------------

-   Implement webhook-handler.ts: validate HMAC, queue sync-diff Inngest
    job.

-   Implement sync-diff.ts: extract changed files from push payload,
    delete stale chunks, re-index, re-trigger generate-docs for affected
    layers.

-   Add the \'last synced\' indicator on every doc page (compare
    updated_at to cie_indexed_at).

-   Build the doc management UI: allow project owners to edit
    auto-generated docs, mark them as manually managed (is_auto = false,
    bypasses auto-update).

-   Deploy to Vercel. Configure Supabase connection pool for serverless
    (add pgbouncer=true to connection string).

-   Performance: verify search latency \< 300ms p95, doc page load \< 1s
    with ISR caching.

-   Write the project\'s own documentation using DevDocs AI (dogfood
    test).

**Part 9: Environment Variables --- Complete Reference**

  -----------------------------------------------------------------------------------
  **Variable**                    **Required**   **Description**
  ------------------------------- -------------- ------------------------------------
  NEXT_PUBLIC_SUPABASE_URL        Yes            Your Supabase project URL. Safe for
                                                 browser.

  NEXT_PUBLIC_SUPABASE_ANON_KEY   Yes            Supabase anon key. Used client-side.
                                                 Subject to RLS.

  SUPABASE_SERVICE_ROLE_KEY       Yes            Supabase service role key.
                                                 Server-side only. Bypasses RLS ---
                                                 never expose to browser.

  OPENROUTER_API_KEY              Yes            API key for OpenRouter. Used for LLM
                                                 doc generation and embeddings.

  GITHUB_CLIENT_ID                Yes            GitHub OAuth App client ID. Create
                                                 at GitHub → Settings → Developer
                                                 Settings → OAuth Apps.

  GITHUB_CLIENT_SECRET            Yes            GitHub OAuth App client secret.
                                                 Never expose. Store in Vercel
                                                 environment variables only.

  GITHUB_WEBHOOK_SECRET           Yes            HMAC secret for validating webhook
                                                 payloads. Generate with: openssl
                                                 rand -hex 20

  INNGEST_EVENT_KEY               Prod only      Inngest event key. Required in
                                                 production. Not needed for local dev
                                                 with Inngest CLI.

  INNGEST_SIGNING_KEY             Prod only      Inngest signing key for validating
                                                 function calls in production.

  EMBEDDING_MODEL                 No             Override embedding model. Default:
                                                 text-embedding-3-small. Use
                                                 voyage-code-3 for better code
                                                 retrieval.

  MAX_CHUNK_TOKENS                No             Max tokens per code chunk. Default:
                                                 800.
  -----------------------------------------------------------------------------------

**Part 10: Dependencies --- Complete Package List**

**10.1 Core application**

> bash
>
> npm install \\
>
> \@supabase/supabase-js \\ \# Supabase client
>
> \@supabase/ssr \\ \# Server-side Supabase helpers for Next.js
>
> inngest \\ \# Background job queue
>
> octokit \\ \# GitHub API client
>
> next-mdx-remote \\ \# Render markdown from database as React
>
> \@mdx-js/react \\ \# MDX React integration
>
> rehype-slug \\ \# Adds id anchors to headings
>
> rehype-autolink-headings \\ \# Makes headings linkable
>
> \@shikijs/rehype \\ \# Syntax highlighting in code blocks
>
> remark-gfm \\ \# GitHub Flavored Markdown support
>
> ignore \\ \# .gitignore parsing (used in CIE)
>
> tiktoken \\ \# Accurate token counting
>
> \@dqbd/tiktoken \# Alternative tiktoken binding

**10.2 CIE parsing**

> bash
>
> npm install \\
>
> tree-sitter \\ \# C-based code parser
>
> tree-sitter-typescript \\ \# TypeScript grammar
>
> tree-sitter-python \\ \# Python grammar
>
> tree-sitter-javascript \\ \# JavaScript grammar
>
> tree-sitter-go \# Go grammar (add more as needed)

**10.3 UI**

> bash
>
> npm install \\
>
> \@radix-ui/react-dialog \\ \# Accessible modal (for search modal)
>
> \@radix-ui/react-tooltip \\ \# Tooltips
>
> cmdk \\ \# Command menu (Cmd+K palette)
>
> lucide-react \\ \# Icons
>
> clsx \\ \# Conditional classnames
>
> tailwind-merge \# Merge Tailwind classes safely

**10.4 Dev dependencies**

> bash
>
> npm install \--save-dev \\
>
> inngest-cli \\ \# Local Inngest dev server
>
> \@types/node \\
>
> tsx \# Run TypeScript files directly

**Part 11: What Goes in v2 (Out of MVP Scope)**

These are explicitly excluded from v1 to protect timeline. Document them
here so they don\'t creep in.

  -------------------------------------------------------------------------
  **Feature**              **Why deferred**
  ------------------------ ------------------------------------------------
  Custom domains           Requires Vercel domain proxy API integration.
  (docs.theirdomain.com)   Non-trivial. Ship with /docs/\[slug\] first.

  GitHub file write-back   MVP stores in Supabase only. Adding GitHub
                           commits is a clean v2 addition --- nothing in v1
                           blocks it.

  AI chat overlay (\'Ask   The vector index already supports it. Build the
  AI\' on every page)      chat UI widget and a /api/docs/chat route in v2.

  Doc versioning (v1/v2    Requires slug namespacing by version.
  switcher)                Architecture supports it but adds UX complexity.

  Custom branding per      Project owners configure logo, colours. CSS
  project                  variable override system --- clean v2 add.

  PDF / Docusaurus export  Useful for enterprise. Export docs_pages content
                           to a static site or PDF bundle.

  Team access controls     Multiple users per project, role-based editing
                           of docs. Requires teams table and policy
                           updates.
  -------------------------------------------------------------------------

**References**

-   Procida, D. (2021). Diátaxis: A systematic approach to technical
    documentation. https://diataxis.fr

-   Mintlify, Inc. (2024). Mintlify Documentation Platform.
    https://mintlify.com --- Referenced as design benchmark for renderer
    UX.

-   Supabase, Inc. (2024). pgvector and Supabase.
    https://supabase.com/docs/guides/database/extensions/pgvector

-   Inngest, Inc. (2024). Inngest: Durable execution for TypeScript.
    https://inngest.com/docs

-   Vercel, Inc. (2024). Incremental Static Regeneration.
    https://vercel.com/docs/frameworks/nextjs/isr

-   Nguyen-Duc, A., & Abrahamsson, P. (2023). Generative AI for Software
    Documentation. IEEE Software, 40(4), 45--54.
