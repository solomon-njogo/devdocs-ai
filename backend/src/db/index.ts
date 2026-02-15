/**
 * Data layer — Supabase and persistence.
 * See README.md for scope and dependencies.
 */

import type { RepoMeta } from "../shared/index.js";

export async function getRepoMeta(_repoId: string): Promise<RepoMeta | null> {
  // TODO: Supabase client
  return null;
}

export async function upsertRepoMeta(_meta: RepoMeta): Promise<void> {
  // TODO: Supabase client
}
