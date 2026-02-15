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
  const redirectTo = searchParams.get("redirect") ?? "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

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
      // If Supabase requires email confirmation, show message; else they're in
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Brief delay so the session is fully persisted before navigation (avoids "invalid token" on next page)
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
        <p className="text-text-muted">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center justify-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md flex flex-col gap-8">
        <header className="text-center">
          <Link href="/" className="text-xl font-semibold text-action-primary hover:underline">
            DevDocs AI
          </Link>
        </header>

        <Card title={mode === "signin" ? "Sign in" : "Create account"} elevated>
          {error && (
            <div className="rounded-lg border border-semantic-error-text/50 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text mb-4">
              {error}
            </div>
          )}
          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
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
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
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
                {loading ? "Creating account…" : "Create account"}
              </Button>
            </form>
          )}
          <p className="text-sm text-text-muted mt-4 text-center">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-action-primary hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-action-primary hover:underline"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </Card>

        <p className="text-center text-sm text-text-muted">
          <Link href="/" className="text-action-primary hover:underline">
            Back to home
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
          <p className="text-text-muted">Loading…</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
