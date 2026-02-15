/**
 * API client for backend. Uses credentials for cookie-based auth.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type ApiOptions = Omit<RequestInit, "body"> & { body?: object };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...init } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function authGitHubUrl(): string {
  return `${API_BASE}/api/auth/github`;
}
