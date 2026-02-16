/**
 * API client for backend. Sends Supabase access token as Bearer for authenticated requests.
 */

import { createSupabaseClient } from "@/lib/supabase";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type ApiOptions = Omit<RequestInit, "body"> & { body?: object };

async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, ...init } = options;
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers,
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Returns the GitHub Connect URL (backend returns JSON with url; frontend must fetch with auth then redirect). */
export async function getAuthGitHubUrl(): Promise<string> {
  const data = await api<{ url: string }>("/api/auth/github");
  return data.url;
}
