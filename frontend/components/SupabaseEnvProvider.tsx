"use client";

import { setSupabaseConfig } from "@/lib/supabase-config";

/**
 * Sets Supabase URL and anon key from server-passed env so the client can create the Supabase client
 * without NEXT_PUBLIC_* (we use SUPABASE_URL and SUPABASE_ANON_KEY only).
 */
export function SupabaseEnvProvider({
  url,
  anonKey,
  children,
}: {
  url: string;
  anonKey: string;
  children: React.ReactNode;
}) {
  setSupabaseConfig(url, anonKey);
  return <>{children}</>;
}
