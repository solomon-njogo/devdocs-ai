/**
 * Supabase client for auth only. Uses SUPABASE_URL and SUPABASE_ANON_KEY.
 * Anon key only — do not use service role for parsing untrusted tokens.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../logger/index.js";

let authClient: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient | null {
  if (authClient) return authClient;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  authClient = createClient(url, anonKey);
  return authClient;
}

/**
 * Verifies the Supabase JWT and returns the user id, or null if invalid/missing.
 */
export async function getUserIdFromToken(accessToken: string): Promise<string | null> {
  const supabase = getSupabaseAuthClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error) {
    logger.warn("Auth: getUser failed", { message: error.message });
    return null;
  }
  if (!data?.user?.id) return null;
  return data.user.id;
}