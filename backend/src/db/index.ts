/**
 * Data layer — Supabase and persistence.
 * See README.md for scope and dependencies.
 * Tables: repo_meta, repo_tokens, projects, project_docs,
 *         indexed_files, code_chunks, symbols, file_dependencies,
 *         docs_pages, docs_nav.
 */

import type {
  Project, ProjectDoc, RepoMeta,
  DocsPage, DocsNavConfig, NavGroup, DocSearchResult,
  CieStatus,
} from "../shared/index.js";
import { logger } from "../logger/index.js";
import { getSupabase } from "./client.js";

const REPO_META_TABLE = "repo_meta";
const PROJECTS_TABLE = "projects";
const PROJECT_DOCS_TABLE = "project_docs";
const USERS_PROFILE_TABLE = "users_profile";

type ProjectRow = {
  id: string;
  session_id: string;
  user_id: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  type: string;
  repo_id: string | null;
  repo_owner: string | null;
  repo_name: string | null;
  repo_branch: string;
  features: string | null;
  requirements: string | null;
  cie_status: string | null;
  cie_indexed_at: string | null;
  cie_chunk_count: number | null;
  cie_docs_planned: number | null;
  cie_error: string | null;
  is_public: boolean | null;
  created_at: string;
  updated_at: string;
};

type ProjectDocRow = {
  id: string;
  project_id: string;
  type: string;
  path: string;
  content: string;
  created_at: string;
};

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id ?? undefined,
    name: row.name,
    slug: row.slug ?? undefined,
    description: row.description ?? undefined,
    type: row.type as "new_idea" | "existing",
    repoId: row.repo_id ?? undefined,
    repoOwner: row.repo_owner ?? undefined,
    repoName: row.repo_name ?? undefined,
    repoBranch: row.repo_branch ?? "main",
    features: row.features ?? undefined,
    requirements: row.requirements ?? undefined,
    cieStatus: (row.cie_status as CieStatus) ?? "pending",
    cieIndexedAt: row.cie_indexed_at ?? undefined,
    cieChunkCount: row.cie_chunk_count ?? 0,
    cieDocsPlanned: row.cie_docs_planned ?? 0,
    cieError: row.cie_error ?? undefined,
    isPublic: row.is_public ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToProjectDoc(row: ProjectDocRow): ProjectDoc {
  return {
    id: row.id,
    projectId: row.project_id,
    type: row.type as "prd" | "user_story" | "user_journey",
    path: row.path,
    content: row.content,
    createdAt: row.created_at,
  };
}

const TABLE = REPO_META_TABLE;

function rowToMeta(row: { id: string; repo_id: string; last_doc_state: string; updated_at: string }): RepoMeta {
  return {
    id: row.id,
    repoId: row.repo_id,
    lastDocState: row.last_doc_state,
    updatedAt: row.updated_at,
  };
}

export async function getRepoMeta(repoId: string): Promise<RepoMeta | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select("*").eq("repo_id", repoId).maybeSingle();
  if (error || !data) return null;
  return rowToMeta(data as { id: string; repo_id: string; last_doc_state: string; updated_at: string });
}

export async function upsertRepoMeta(meta: RepoMeta & { projectId?: string | null }): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from(TABLE).upsert(
    {
      id: meta.id,
      repo_id: meta.repoId,
      last_doc_state: meta.lastDocState,
      updated_at: meta.updatedAt,
      ...(meta.projectId != null && { project_id: meta.projectId }),
    },
    { onConflict: "repo_id" }
  );
}

/** Store GitHub token per repo for webhook-triggered sync. Optionally link to project. */
export async function setRepoToken(repoId: string, token: string, projectId?: string | null): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("repo_tokens").upsert(
    {
      repo_id: repoId,
      token,
      updated_at: new Date().toISOString(),
      ...(projectId != null && { project_id: projectId }),
    },
    { onConflict: "repo_id" }
  );
}

/** Resolve project id for a repo (project that has this repo_id). Used by webhook to link repo_meta. */
export async function getProjectIdByRepoId(repoId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from(PROJECTS_TABLE)
    .select("id")
    .eq("repo_id", repoId)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getRepoToken(repoId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("repo_tokens").select("token").eq("repo_id", repoId).maybeSingle();
  return (data as { token: string } | null)?.token ?? null;
}

/** Persist a GitHub token for a user so OAuth survives Vercel serverless instances. */
export async function setUserGithubToken(userId: string, token: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from(USERS_PROFILE_TABLE)
    .upsert(
      {
        user_id: userId,
        github_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  if (error) {
    logger.error("DB: set user github token failed", { error: error.message, userId });
    return false;
  }
  return true;
}

/** Read the persisted GitHub token for a user. */
export async function getUserGithubToken(userId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(USERS_PROFILE_TABLE)
    .select("github_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { github_token: string | null }).github_token ?? null;
}

/** Clear the persisted GitHub token for a user. */
export async function deleteUserGithubToken(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from(USERS_PROFILE_TABLE)
    .update({ github_token: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) {
    logger.error("DB: delete user github token failed", { error: error.message, userId });
    return false;
  }
  return true;
}

/** Create a project; returns the created project with id from DB. Requires userId for ownership. */
export async function createProject(row: {
  userId: string;
  sessionId?: string | null;
  name: string;
  slug?: string | null;
  description?: string | null;
  type: "new_idea" | "existing";
  repoId?: string | null;
  repoOwner?: string | null;
  repoName?: string | null;
  repoBranch?: string | null;
  features?: string | null;
  requirements?: string | null;
}): Promise<Project> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const slug = row.slug ?? generateSlug(row.name);
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .insert({
      user_id: row.userId,
      session_id: row.sessionId ?? null,
      name: row.name,
      slug,
      description: row.description ?? null,
      type: row.type,
      repo_id: row.repoId ?? null,
      repo_owner: row.repoOwner ?? null,
      repo_name: row.repoName ?? null,
      repo_branch: row.repoBranch ?? "main",
      features: row.features ?? null,
      requirements: row.requirements ?? null,
    })
    .select()
    .single();
  if (error || !data) {
    logger.error("DB: create project failed", { error: error?.message });
    throw new Error(error?.message ?? "Failed to create project");
  }
  return rowToProject(data as ProjectRow);
}

/** Generate a URL-safe slug from a project name, with random suffix for uniqueness. */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

/** List projects for a user, newest first. */
export async function getProjectsByUserId(userId: string): Promise<Project[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as ProjectRow[]).map(rowToProject);
}

/** Get a single project by id; returns null if not found. If userId is provided, enforces ownership. */
export async function getProjectById(id: string, userId?: string): Promise<Project | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  let query = supabase.from(PROJECTS_TABLE).select("*").eq("id", id);
  if (userId) query = query.eq("user_id", userId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return rowToProject(data as ProjectRow);
}

/** Delete a project owned by userId. Related rows follow DB ON DELETE rules. */
export async function deleteProjectById(projectId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from(PROJECTS_TABLE)
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId);
  if (error) {
    logger.error("DB: delete project failed", { error: error.message, projectId });
    return false;
  }
  return true;
}

/** Insert generated docs for a project (e.g. after onboarding). */
export async function insertProjectDocs(
  projectId: string,
  docs: { type: "prd" | "user_story" | "user_journey"; path: string; content: string }[]
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  if (docs.length === 0) return;
  const rows = docs.map((d) => ({
    project_id: projectId,
    type: d.type,
    path: d.path,
    content: d.content,
  }));
  const { error } = await supabase.from(PROJECT_DOCS_TABLE).insert(rows);
  if (error) logger.error("DB: insert project docs failed", { error: error.message, projectId });
}

/** List docs for a project, oldest first. */
export async function getDocsByProjectId(projectId: string): Promise<ProjectDoc[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from(PROJECT_DOCS_TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as ProjectDocRow[]).map(rowToProjectDoc);
}

/** Get a single doc by id; optionally restrict by projectId for ownership checks. */
export async function getDocById(
  docId: string,
  projectId?: string
): Promise<ProjectDoc | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  let query = supabase.from(PROJECT_DOCS_TABLE).select("*").eq("id", docId);
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query.maybeSingle();
  if (error || !data) return null;
  return rowToProjectDoc(data as ProjectDocRow);
}

/** Update a doc; only updates provided fields. */
export async function updateProjectDoc(
  docId: string,
  projectId: string,
  payload: { content?: string; path?: string; type?: "prd" | "user_story" | "user_journey" }
): Promise<ProjectDoc | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const updates: Partial<ProjectDocRow> = {};
  if (payload.content !== undefined) updates.content = payload.content;
  if (payload.path !== undefined) updates.path = payload.path;
  if (payload.type !== undefined) updates.type = payload.type;
  if (Object.keys(updates).length === 0) return getDocById(docId, projectId);
  const { data, error } = await supabase
    .from(PROJECT_DOCS_TABLE)
    .update(updates)
    .eq("id", docId)
    .eq("project_id", projectId)
    .select()
    .single();
  if (error) {
    logger.error("DB: update project doc failed", { error: error.message, docId, projectId });
    return null;
  }
  return rowToProjectDoc(data as ProjectDocRow);
}

/** Delete a doc belonging to the project. */
export async function deleteProjectDoc(docId: string, projectId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from(PROJECT_DOCS_TABLE)
    .delete()
    .eq("id", docId)
    .eq("project_id", projectId);
  if (error) {
    logger.error("DB: delete project doc failed", { error: error.message, docId, projectId });
    return false;
  }
  return true;
}

/** Insert a single doc and return the created doc. */
export async function insertProjectDoc(
  projectId: string,
  doc: { type: "prd" | "user_story" | "user_journey"; path: string; content: string }
): Promise<ProjectDoc | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(PROJECT_DOCS_TABLE)
    .insert({
      project_id: projectId,
      type: doc.type,
      path: doc.path,
      content: doc.content,
    })
    .select()
    .single();
  if (error) {
    logger.error("DB: insert project doc failed", { error: error.message, projectId });
    return null;
  }
  return rowToProjectDoc(data as ProjectDocRow);
}

// ── CIE status helpers ──────────────────────────────────────

/** Update the CIE indexing status on a project. */
export async function updateCieStatus(
  projectId: string,
  status: CieStatus,
  extra?: { chunkCount?: number; docsPlanned?: number; error?: string | null; indexedAt?: string }
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const update: Record<string, unknown> = { cie_status: status };
  if (extra?.chunkCount !== undefined) update.cie_chunk_count = extra.chunkCount;
  if (extra?.docsPlanned !== undefined) update.cie_docs_planned = extra.docsPlanned;
  if (extra?.error !== undefined) update.cie_error = extra.error;
  if (extra?.indexedAt !== undefined) update.cie_indexed_at = extra.indexedAt;
  const { error } = await supabase.from(PROJECTS_TABLE).update(update).eq("id", projectId);
  if (error) logger.error("DB: update CIE status failed", { error: error.message, projectId });
}

/** Resolve a project by its public slug; returns null if not found. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProject(data as ProjectRow);
}

// ── Docs pages (renderer) ───────────────────────────────────

type DocsPageRow = {
  id: string;
  project_id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  layer: string;
  is_auto: boolean;
  source_files: string[] | null;
  source_sha: string | null;
  created_at: string;
  updated_at: string;
};

function rowToDocsPage(row: DocsPageRow): DocsPage {
  return {
    id: row.id,
    projectId: row.project_id,
    slug: row.slug,
    title: row.title,
    content: row.content,
    summary: row.summary,
    layer: row.layer as DocsPage["layer"],
    isAuto: row.is_auto,
    sourceFiles: row.source_files ?? [],
    sourceSha: row.source_sha ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Upsert a generated doc page (on conflict: project_id + slug). */
export async function upsertDocsPage(page: {
  projectId: string;
  slug: string;
  title: string;
  content: string;
  summary?: string | null;
  layer: string;
  isAuto?: boolean;
  sourceFiles?: string[];
  sourceSha?: string | null;
  embedding?: number[] | null;
}): Promise<DocsPage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("docs_pages")
    .upsert(
      {
        project_id: page.projectId,
        slug: page.slug,
        title: page.title,
        content: page.content,
        summary: page.summary ?? null,
        layer: page.layer,
        is_auto: page.isAuto ?? true,
        source_files: page.sourceFiles ?? [],
        source_sha: page.sourceSha ?? null,
        embedding: page.embedding ?? null,
      },
      { onConflict: "project_id,slug" }
    )
    .select()
    .single();
  if (error) {
    logger.error("DB: upsert docs_page failed", { error: error.message, slug: page.slug });
    return null;
  }
  return rowToDocsPage(data as DocsPageRow);
}

/** List all docs pages for a project, ordered by creation. */
export async function getDocsPagesByProject(projectId: string): Promise<DocsPage[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("docs_pages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as DocsPageRow[]).map(rowToDocsPage);
}

/** Fetch a single docs page by project + slug. */
export async function getDocsPageBySlug(
  projectId: string,
  slug: string
): Promise<DocsPage | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("docs_pages")
    .select("*")
    .eq("project_id", projectId)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToDocsPage(data as DocsPageRow);
}

/** Delete all docs pages for a project (used before full regeneration). */
export async function deleteDocsPagesByProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { error } = await supabase
    .from("docs_pages")
    .delete()
    .eq("project_id", projectId);
  if (error) logger.error("DB: delete docs_pages failed", { error: error.message, projectId });
}

// ── Docs nav ────────────────────────────────────────────────

/** Get custom nav config for a project; returns null if none set. */
export async function getDocsNav(projectId: string): Promise<NavGroup[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase
    .from("docs_nav")
    .select("config")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!data?.config) return null;
  return (data.config as { groups: NavGroup[] }).groups;
}

// ── CIE: indexed files ─────────────────────────────────────

/** Upsert an indexed file record. */
export async function upsertIndexedFile(row: {
  projectId: string;
  filePath: string;
  language?: string | null;
  fileSha: string;
  sizeBytes?: number | null;
  chunkCount?: number;
}): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("indexed_files")
    .upsert(
      {
        project_id: row.projectId,
        file_path: row.filePath,
        language: row.language ?? null,
        file_sha: row.fileSha,
        size_bytes: row.sizeBytes ?? null,
        chunk_count: row.chunkCount ?? 0,
        indexed_at: new Date().toISOString(),
      },
      { onConflict: "project_id,file_path" }
    )
    .select("id")
    .single();
  if (error) {
    logger.error("DB: upsert indexed_file failed", { error: error.message });
    return null;
  }
  return (data as { id: string }).id;
}

/** Delete all indexed files for a project (full reindex). */
export async function deleteIndexedFilesByProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("indexed_files").delete().eq("project_id", projectId);
}

// ── CIE: code chunks ───────────────────────────────────────

/** Bulk-insert code chunks for a file. Deletes existing chunks for the file first. */
export async function replaceChunksForFile(
  projectId: string,
  fileId: string,
  chunks: Array<{
    filePath: string;
    language: string;
    chunkType: string;
    symbolName?: string | null;
    parentSymbol?: string | null;
    content: string;
    contentHash: string;
    startLine?: number | null;
    endLine?: number | null;
    tokenCount?: number | null;
    embedding?: number[] | null;
  }>
): Promise<number> {
  const supabase = getSupabase();
  if (!supabase) return 0;
  await supabase.from("code_chunks").delete().eq("file_id", fileId);
  if (chunks.length === 0) return 0;
  const rows = chunks.map((c) => ({
    project_id: projectId,
    file_id: fileId,
    file_path: c.filePath,
    language: c.language,
    chunk_type: c.chunkType,
    symbol_name: c.symbolName ?? null,
    parent_symbol: c.parentSymbol ?? null,
    content: c.content,
    content_hash: c.contentHash,
    start_line: c.startLine ?? null,
    end_line: c.endLine ?? null,
    token_count: c.tokenCount ?? null,
    embedding: c.embedding ?? null,
  }));
  const { error } = await supabase.from("code_chunks").insert(rows);
  if (error) {
    logger.error("DB: insert chunks failed", { error: error.message, fileId });
    return 0;
  }
  return rows.length;
}

/** Delete all code chunks for a project (full reindex). */
export async function deleteChunksByProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("code_chunks").delete().eq("project_id", projectId);
}

// ── CIE: symbols ───────────────────────────────────────────

/** Bulk-upsert symbols for a project. */
export async function upsertSymbols(
  projectId: string,
  symbols: Array<{
    filePath: string;
    name: string;
    kind: string;
    parentName?: string | null;
    signature?: string | null;
    docstring?: string | null;
    startLine?: number | null;
    endLine?: number | null;
    isExported?: boolean;
  }>
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || symbols.length === 0) return;
  const rows = symbols.map((s) => ({
    project_id: projectId,
    file_path: s.filePath,
    name: s.name,
    kind: s.kind,
    parent_name: s.parentName ?? null,
    signature: s.signature ?? null,
    docstring: s.docstring ?? null,
    start_line: s.startLine ?? null,
    end_line: s.endLine ?? null,
    is_exported: s.isExported ?? false,
  }));
  const { error } = await supabase
    .from("symbols")
    .upsert(rows, { onConflict: "project_id,file_path,name,kind" });
  if (error) logger.error("DB: upsert symbols failed", { error: error.message, projectId });
}

/** Delete all symbols for a project (full reindex). */
export async function deleteSymbolsByProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("symbols").delete().eq("project_id", projectId);
}

// ── CIE: file dependencies ─────────────────────────────────

/** Bulk-upsert file dependency edges. */
export async function upsertFileDependencies(
  projectId: string,
  deps: Array<{
    fromFile: string;
    toFile: string;
    importNames?: string[];
    isTypeOnly?: boolean;
  }>
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || deps.length === 0) return;
  const rows = deps.map((d) => ({
    project_id: projectId,
    from_file: d.fromFile,
    to_file: d.toFile,
    import_names: d.importNames ?? [],
    is_type_only: d.isTypeOnly ?? false,
  }));
  const { error } = await supabase
    .from("file_dependencies")
    .upsert(rows, { onConflict: "project_id,from_file,to_file" });
  if (error) logger.error("DB: upsert file deps failed", { error: error.message, projectId });
}

/** Delete all file dependencies for a project. */
export async function deleteFileDependenciesByProject(projectId: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("file_dependencies").delete().eq("project_id", projectId);
}

// ── Search RPCs ─────────────────────────────────────────────

/** Full-text search over docs_pages. */
export async function ftsSearchDocs(
  projectId: string,
  query: string,
  matchCount = 10,
  minRank = 0.02
): Promise<DocSearchResult[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("fts_docs", {
    p_project_id: projectId,
    p_query: query,
    p_match_count: matchCount,
    p_min_rank: minRank,
  });
  if (error) {
    logger.error("DB: FTS search failed", { error: error.message });
    return [];
  }
  return (data ?? []) as DocSearchResult[];
}

/** Semantic vector search over docs_pages. */
export async function vectorSearchDocs(
  projectId: string,
  queryEmbedding: number[],
  matchCount = 10,
  minSimilarity = 0.65
): Promise<DocSearchResult[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("search_docs", {
    p_project_id: projectId,
    p_query_embedding: queryEmbedding,
    p_match_count: matchCount,
    p_min_similarity: minSimilarity,
  });
  if (error) {
    logger.error("DB: vector search failed", { error: error.message });
    return [];
  }
  return (data ?? []) as DocSearchResult[];
}

/** Semantic vector search over code_chunks (for context assembly). */
export async function vectorSearchChunks(
  projectId: string,
  queryEmbedding: number[],
  matchCount = 20,
  minSimilarity = 0.72
): Promise<Array<{ id: string; filePath: string; content: string; similarity: number }>> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("match_code_chunks", {
    p_project_id: projectId,
    p_query_embedding: queryEmbedding,
    p_match_count: matchCount,
    p_min_similarity: minSimilarity,
  });
  if (error) {
    logger.error("DB: chunk vector search failed", { error: error.message });
    return [];
  }
  return (data ?? []) as Array<{ id: string; filePath: string; content: string; similarity: number }>;
}
