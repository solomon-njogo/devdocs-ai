"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createSupabaseClient } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
    const prefilled = searchParams.get("email")?.trim();
    if (prefilled) {
      setEmail(prefilled);
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setCheckingSession(false);
      return;
    }
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) router.replace(redirectTo);
        else setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));
  }, [redirectTo, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. In your .env at the project root, set SUPABASE_URL and SUPABASE_ANON_KEY (from Supabase Dashboard → Settings → API). Restart the dev server after saving .env."
      );
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (err) {
        setError(err.message ?? "Sign in failed. Please try again.");
        return;
      }
      router.replace(redirectTo);
    } catch {
      setError("We couldn't sign you in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const supabase = createSupabaseClient();
    if (!supabase) {
      setError(
        "Supabase is not configured. In your .env at the project root, set SUPABASE_URL and SUPABASE_ANON_KEY (from Supabase Dashboard → Settings → API). Restart the dev server after saving .env."
      );
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      if (err) {
        setError(err.message ?? "Sign up failed. Please try again.");
        return;
      }
      setError(null);
      setMode("signin");
      setPassword("");
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await new Promise((r) => setTimeout(r, 150));
        router.replace(redirectTo);
      } else {
        setError("Check your email to confirm your account, then sign in.");
      }
    } catch {
      setError("We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-action-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-action-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-md flex flex-col gap-8 relative z-10 animate-fade-in">
        {/* Brand header */}
        <header className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">DevDocs AI</span>
          </Link>
          <p className="text-text-muted text-sm mt-3">
            AI-powered development documentation
          </p>
        </header>

        {/* Login card */}
        <Card elevated>
          <div className="space-y-6">
            {/* Tab-like switcher */}
            <div className="flex rounded-lg bg-bg-tertiary p-1 gap-1">
              <button
                type="button"
                onClick={() => { setMode("signin"); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-[var(--duration-normal)] cursor-pointer ${mode === "signin"
                  ? "bg-bg-secondary text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
                  }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all duration-[var(--duration-normal)] cursor-pointer ${mode === "signup"
                  ? "bg-bg-secondary text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
                  }`}
              >
                Create account
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-semantic-error-text/30 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text animate-fade-in">
                {error}
              </div>
            )}

            {mode === "signin" ? (
              <form onSubmit={handleSignIn} className="flex flex-col gap-5">
                <Input
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-text-on-primary/30 border-t-text-on-primary rounded-full animate-spin" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="flex flex-col gap-5">
                <Input
                  label="Email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-text-on-primary/30 border-t-text-on-primary rounded-full animate-spin" />
                      Creating account…
                    </span>
                  ) : "Create account"}
                </Button>
              </form>
            )}
          </div>
        </Card>

        <p className="text-center text-sm text-text-muted">
          <Link href="/" className="text-action-primary hover:text-action-primary-hover transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-primary flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-text-muted">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
