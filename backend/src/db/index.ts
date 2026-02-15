/**
 * Data layer — Supabase and persistence.
 * See README.md for scope and dependencies.
 * Tables: repo_meta, repo_tokens, projects, project_docs.
 */

import type { Project, ProjectDoc, RepoMeta } from "../shared/index.js";
import { logger } from "../logger/index.js";
import { getSupabase } from "./client.js";

const REPO_META_TABLE = "repo_meta";
const PROJECTS_TABLE = "projects";
const PROJECT_DOCS_TABLE = "project_docs";

type ProjectRow = {
  id: string;
  session_id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  type: string;
  repo_id: string | null;
  features: string | null;
  requirements: string | null;
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
    description: row.description ?? undefined,
    type: row.type as "new_idea" | "existing",
    repoId: row.repo_id ?? undefined,
    features: row.features ?? undefined,
    requirements: row.requirements ?? undefined,
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

/** Create a project; returns the created project with id from DB. Requires userId for ownership. */
export async function createProject(row: {
  userId: string;
  sessionId?: string | null;
  name: string;
  description?: string | null;
  type: "new_idea" | "existing";
  repoId?: string | null;
  features?: string | null;
  requirements?: string | null;
}): Promise<Project> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from(PROJECTS_TABLE)
    .insert({
      user_id: row.userId,
      session_id: row.sessionId ?? null,
      name: row.name,
      description: row.description ?? null,
      type: row.type,
      repo_id: row.repoId ?? null,
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
