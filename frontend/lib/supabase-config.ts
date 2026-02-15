/**
 * Supabase URL and anon key for the browser client.
 * Set by SupabaseEnvProvider from server-passed env (SUPABASE_URL, SUPABASE_ANON_KEY).
 */

let config: { url: string; anonKey: string } | null = null;

export function setSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) config = { url, anonKey };
  else config = null;
}

export function getSupabaseConfig(): { url: string; anonKey: string } | null {
  return config;
}
