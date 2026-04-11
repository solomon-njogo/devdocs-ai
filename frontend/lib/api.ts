/**
 * API client for backend. Sends Supabase access token as Bearer for authenticated requests.
 */

import { createSupabaseClient } from "@/lib/supabase";

// Use environment variable or detect based on hostname
const API_BASE = (() => {
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  // In production (Vercel and similar), use the backend URL
  // In development (localhost), use localhost:4000
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "https://devdocs-ai-backend.vercel.app";
})();
const MAX_NETWORK_RETRIES = 2;
const RETRY_DELAY_MS = 300;

type ApiOptions = Omit<RequestInit, "body"> & { body?: object };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error: unknown): boolean {
  return error instanceof TypeError;
}

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

  let res: Response;
  for (let attempt = 0; ; attempt += 1) {
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        credentials: "include",
        headers,
        ...(body !== undefined && { body: JSON.stringify(body) }),
      });
      break;
    } catch (error) {
      const method = (init.method ?? "GET").toUpperCase();
      const canRetry = method === "GET" && attempt < MAX_NETWORK_RETRIES && isRetryableNetworkError(error);
      if (canRetry) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        continue;
      }
      throw new Error("Unable to reach the API server. Ensure the backend is running on port 4000.");
    }
  }

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

export interface IntegrationStatus {
  connected: boolean;
}

export interface AllIntegrationsStatus {
  github: IntegrationStatus;
  gitlab: IntegrationStatus;
  linear: IntegrationStatus;
}

export async function getIntegrationStatus(): Promise<AllIntegrationsStatus> {
  return api<AllIntegrationsStatus>("/api/auth/status");
}
