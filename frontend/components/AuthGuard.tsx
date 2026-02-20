"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const PROTECTED_PATHS = ["/dashboard", "/onboarding"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!pathname || !PROTECTED_PATHS.includes(pathname)) {
      setChecking(false);
      return;
    }
    const supabase = createSupabaseClient();
    if (!supabase) {
      setChecking(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!data.session) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [pathname, router]);

  if (checking && pathname && PROTECTED_PATHS.includes(pathname)) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }
  return <>{children}</>;
}
