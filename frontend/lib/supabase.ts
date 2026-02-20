/**
 * Supabase browser client for Auth. Config comes from server via SupabaseEnvProvider (SUPABASE_URL, SUPABASE_ANON_KEY).
 * Returns null when config is missing so the app can load without crashing.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./supabase-config";

let client: SupabaseClient | null = null;

export function createSupabaseClient(): SupabaseClient | null {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config?.url || !config?.anonKey) return null;
  client = createClient(config.url, config.anonKey);
  return client;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config?.url && config?.anonKey);
}