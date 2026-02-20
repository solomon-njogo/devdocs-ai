/**
 * In-memory store for GitHub OAuth tokens keyed by user id.
 * Used by auth callback and authenticated routes. Survives per-user; consider DB for production.
 */

const store = new Map<string, { token: string }>();

export function setToken(userId: string, token: string): void {
  store.set(userId, { token });
}

export function getToken(userId: string): string | null {
  const entry = store.get(userId);
  return entry?.token ?? null;
}

export function deleteToken(userId: string): void {
  store.delete(userId);
}
