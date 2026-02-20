"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { ThemeToggle } from "./theme-toggle";
import type { User } from "@supabase/supabase-js";

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    router.replace("/login");
  };

  if (!user) return null;

  const initial = (user.email ?? "U")[0].toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-badge bg-surface-hover/50 border border-surface-border">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center text-xs font-bold text-text-on-primary">
          {initial}
        </div>
        <span className="text-sm text-text-secondary truncate max-w-[120px] sm:max-w-[160px] hidden sm:inline" title={user.email ?? undefined}>
          {user.email}
        </span>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-text-muted hover:text-semantic-error-text transition-colors duration-[var(--duration-fast)] cursor-pointer"
      >
        Sign out
      </button>
    </div>
  );
}
