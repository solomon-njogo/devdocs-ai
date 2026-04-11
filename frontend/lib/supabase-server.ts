/**
 * Server-side Supabase client for RSC (React Server Components).
 * Uses the anon key so RLS policies apply (public docs are readable by anon).
 */

import { createClient } from "@supabase/supabase-js";

export function createServerSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) throw new Error("Supabase server config missing");
  return createClient(url, key);
}
