"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
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

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-text-muted truncate max-w-[140px] sm:max-w-[200px]" title={user.email ?? undefined}>
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-action-primary hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
