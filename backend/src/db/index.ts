/**
 * Data layer — Supabase and persistence.
 * See README.md for scope and dependencies.
 * Table repo_meta: id, repo_id, last_doc_state, updated_at (ISO string).
 */

import type { RepoMeta } from "../shared/index.js";
import { getSupabase } from "./client.js";

const TABLE = "repo_meta";

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

export async function upsertRepoMeta(meta: RepoMeta): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from(TABLE).upsert(
    {
      id: meta.id,
      repo_id: meta.repoId,
      last_doc_state: meta.lastDocState,
      updated_at: meta.updatedAt,
    },
    { onConflict: "repo_id" }
  );
}

/** Optional: store GitHub token per repo for webhook-triggered sync. Table: repo_tokens (repo_id, token, updated_at). */
export async function setRepoToken(repoId: string, token: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  await supabase.from("repo_tokens").upsert(
    { repo_id: repoId, token, updated_at: new Date().toISOString() },
    { onConflict: "repo_id" }
  );
}

export async function getRepoToken(repoId: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.from("repo_tokens").select("token").eq("repo_id", repoId).maybeSingle();
  return (data as { token: string } | null)?.token ?? null;
}
