"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const PROTECTED_PATHS = ["/dashboard", "/onboarding"];

function isProtected(path: string | null): boolean {
  return !!path && PROTECTED_PATHS.includes(path);
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(() => isProtected(pathname));

  useEffect(() => {
    if (!isProtected(pathname)) return;

    let cancelled = false;
    const supabase = createSupabaseClient();
    if (!supabase) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname!)}`);
      Promise.resolve().then(() => {
        if (!cancelled) setChecking(false);
      });
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        if (!data.session) {
          router.replace(`/login?redirect=${encodeURIComponent(pathname!)}`);
        }
        setChecking(false);
      })
      .catch(() => { if (!cancelled) setChecking(false); });

    return () => { cancelled = true; };
  }, [pathname, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }
  return <>{children}</>;
}

