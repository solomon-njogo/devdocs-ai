/**
 * In-memory store for GitHub OAuth tokens keyed by session id.
 * Used by auth callback and authenticated routes. Replace with DB in production.
 */

const store = new Map<string, { token: string }>();

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function setToken(sessionId: string, token: string): void {
  store.set(sessionId, { token });
  // Simple TTL: no timer cleanup; could use a proper cache with TTL later
}

export function getToken(sessionId: string): string | null {
  const entry = store.get(sessionId);
  return entry?.token ?? null;
}

export function deleteToken(sessionId: string): void {
  store.delete(sessionId);
}
