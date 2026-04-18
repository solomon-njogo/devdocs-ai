/**
 * GitHub OAuth token storage.
 * Uses Supabase for persistence when available, with an in-memory fallback for local dev.
 */

import { deleteUserGithubToken, getUserGithubToken, setUserGithubToken } from "./db/index.js";

const store = new Map<string, { token: string }>();

export async function setToken(userId: string, token: string): Promise<void> {
  const persisted = await setUserGithubToken(userId, token);
  if (!persisted) {
    store.set(userId, { token });
  }
}

export async function getToken(userId: string): Promise<string | null> {
  const persisted = await getUserGithubToken(userId);
  if (persisted) return persisted;
  const entry = store.get(userId);
  return entry?.token ?? null;
}

export async function deleteToken(userId: string): Promise<void> {
  const persisted = await deleteUserGithubToken(userId);
  if (!persisted) {
    store.delete(userId);
  }
}
