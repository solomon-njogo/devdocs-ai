"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { UserMenu } from "@/components/UserMenu";
import { useRouter } from "next/navigation";
import { api, getAuthGitHubUrl } from "@/lib/api";
import type { Project } from "@/lib/projects";

type Step = 1 | 2 | 3 | 4;
type ProjectStatus = "new_idea" | "existing" | null;
interface NewIdeaResponse { project: Project; projectName: string; docs: { type: string; path: string; content: string }[]; }
interface ReviewRepoResponse { project: Project; repoId: string; paths: string[]; summary: string; }

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1, done = s < current, active = s === current;
        return (<div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${done ? "bg-action-primary text-text-on-primary" : active ? "bg-action-primary/15 text-action-primary border-2 border-action-primary" : "bg-surface-hover text-text-muted border border-surface-border"}`}>
            {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg> : s}
          </div>
          {s < total && <div className={`w-8 h-0.5 rounded-full ${done ? "bg-action-primary" : "bg-surface-border"}`} />}
        </div>);
      })}
    </div>
  );
}

const ta = "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-4 py-2.5 text-base placeholder:text-text-faded focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all duration-[var(--duration-normal)]";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [status, setStatus] = useState<ProjectStatus>(null);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [requirements, setRequirements] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [repoId, setRepoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideaResult, setIdeaResult] = useState<NewIdeaResponse | null>(null);
  const [repoResult, setRepoResult] = useState<ReviewRepoResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectingGitHub, setConnectingGitHub] = useState(false);

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (p.get("connected") === "1") setConnected(true);
    if (p.get("error") === "oauth_failed") setError("GitHub sign-in failed. Please try again.");
    if (p.get("error") === "missing_code") setError("GitHub did not return a code. Please try again.");
  }, []);

  const handleStep1 = (c: "new_idea" | "existing") => { setStatus(c); setError(null); setStep(2); };

  const handleNewIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const r = await api<NewIdeaResponse>("/api/onboarding/idea", { method: "POST", body: { projectName: projectName.trim(), description: description.trim(), features: features.trim() || undefined, requirements: requirements.trim() || undefined, additionalInfo: additionalInfo.trim() || undefined } });
      setIdeaResult(r); setStep(3);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const handleReviewRepo = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      const r = await api<ReviewRepoResponse>("/api/onboarding/review-repo", { method: "POST", body: { repoId: repoId.trim() } });
      setRepoResult(r); setStep(3);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong."); }
    finally { setLoading(false); }
  };

  const Spinner = () => <span className="w-4 h-4 border-2 border-text-on-primary/30 border-t-text-on-primary rounded-full animate-spin" />;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-surface-border bg-surface-header backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            </div>
            <span className="text-lg font-bold gradient-text">DevDocs AI</span>
          </Link>
          <UserMenu />
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-action-primary/50 to-transparent" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold">Create a project</h2>
          <StepDots current={step} total={4} />
        </div>

        {error && <div className="rounded-lg border border-semantic-error-text/30 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text mb-6 animate-fade-in">{error}</div>}

        {step === 1 && (
          <Card elevated><div className="space-y-6">
            <div><h3 className="text-lg font-semibold mb-2">What are you working on?</h3><p className="text-text-muted">Choose whether you&apos;re starting fresh or documenting an existing project.</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <button type="button" onClick={() => handleStep1("new_idea")} className="group p-6 rounded-xl border border-surface-border hover:border-action-primary/40 bg-bg-primary hover:bg-action-primary/5 transition-all text-left cursor-pointer hover:shadow-[0_0_20px_var(--color-glow)]">
                <div className="w-12 h-12 rounded-xl bg-action-primary/10 group-hover:bg-action-primary/20 flex items-center justify-center mb-4 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-action-primary"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" /></svg>
                </div>
                <h4 className="font-semibold mb-1 group-hover:text-action-primary transition-colors">New idea</h4>
                <p className="text-sm text-text-muted">Describe your project and we&apos;ll generate docs</p>
              </button>
              <button type="button" onClick={() => handleStep1("existing")} className="group p-6 rounded-xl border border-surface-border hover:border-action-primary/40 bg-bg-primary hover:bg-action-primary/5 transition-all text-left cursor-pointer hover:shadow-[0_0_20px_var(--color-glow)]">
                <div className="w-12 h-12 rounded-xl bg-action-primary/10 group-hover:bg-action-primary/20 flex items-center justify-center mb-4 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-action-primary"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                </div>
                <h4 className="font-semibold mb-1 group-hover:text-action-primary transition-colors">Existing project</h4>
                <p className="text-sm text-text-muted">Connect a GitHub repo and we&apos;ll analyze it</p>
              </button>
            </div>
          </div></Card>
        )}

        {step === 2 && status === "new_idea" && (
          <Card elevated><form onSubmit={handleNewIdeaSubmit} className="space-y-5">
            <div><h3 className="text-lg font-semibold mb-1">Describe your idea</h3><p className="text-sm text-text-muted">Tell us about your project and we&apos;ll generate documentation.</p></div>
            <Input label="Project name" required value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="My App" />
            <div><label className="block text-sm font-medium text-text-secondary mb-2">Description *</label><textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="What is your project about?" className={`${ta} min-h-[120px]`} rows={4} /></div>
            <div><label className="block text-sm font-medium text-text-muted mb-2">Features (optional)</label><textarea value={features} onChange={e => setFeatures(e.target.value)} placeholder="Key features" className={`${ta} min-h-[80px]`} rows={2} /></div>
            <div><label className="block text-sm font-medium text-text-muted mb-2">Requirements (optional)</label><textarea value={requirements} onChange={e => setRequirements(e.target.value)} placeholder="Technical or business requirements" className={`${ta} min-h-[80px]`} rows={2} /></div>
            <div><label className="block text-sm font-medium text-text-muted mb-2">Additional info (optional)</label><textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="Anything else" className={`${ta} min-h-[60px]`} rows={2} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
              <Button type="submit" disabled={loading}>{loading ? <span className="flex items-center gap-2"><Spinner />Generating…</span> : "Review and generate docs"}</Button>
            </div>
          </form></Card>
        )}

        {step === 2 && status === "existing" && (
          <Card elevated><div className="space-y-5">
            <div><h3 className="text-lg font-semibold mb-1">Connect your repository</h3><p className="text-sm text-text-muted">Link your GitHub account to read your repo.</p></div>
            {!connected ? (<>
              <div className="p-6 rounded-xl border border-surface-border bg-bg-primary text-center">
                <div className="w-12 h-12 rounded-xl bg-surface-hover flex items-center justify-center mx-auto mb-4">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </div>
                <Button variant="primary" size="lg" disabled={connectingGitHub} onClick={async () => { setConnectingGitHub(true); setError(null); try { const url = await getAuthGitHubUrl(); window.location.href = url; } catch (err) { setError(err instanceof Error ? err.message : "Could not start GitHub connect."); setConnectingGitHub(false); } }}>
                  {connectingGitHub ? <span className="flex items-center gap-2"><Spinner />Redirecting…</span> : "Connect GitHub"}
                </Button>
              </div>
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
            </>) : (
              <form onSubmit={handleReviewRepo} className="space-y-5">
                <div className="flex items-center gap-2 text-sm text-semantic-success-text bg-semantic-success-bg rounded-lg px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  GitHub connected
                </div>
                <Input label="Repository" required value={repoId} onChange={e => setRepoId(e.target.value)} placeholder="owner/repo" hint="Format: owner/repo (e.g. octocat/Hello-World)" />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>← Back</Button>
                  <Button type="submit" disabled={loading}>{loading ? <span className="flex items-center gap-2"><Spinner />Generating…</span> : "Review and generate docs"}</Button>
                </div>
              </form>
            )}
          </div></Card>
        )}

        {step === 3 && (
          <Card elevated><div className="space-y-5">
            <h3 className="text-lg font-semibold">Generated documentation</h3>
            {ideaResult && (<>
              <p className="text-text-secondary">Generated for <strong className="text-text-primary">{ideaResult.projectName}</strong>:</p>
              <ul className="space-y-2">{ideaResult.docs.map(d => (<li key={d.path} className="flex items-center gap-3 p-3 rounded-lg bg-bg-primary border border-surface-border"><span className="font-medium text-sm">{d.type}</span><span className="text-text-muted text-sm">{d.path}</span></li>))}</ul>
              <div className="rounded-lg border border-surface-border bg-bg-primary p-4 max-h-60 overflow-auto space-y-4">{ideaResult.docs.map(d => (<div key={d.path}><h4 className="text-sm font-semibold mb-2">{d.path}</h4><pre className="text-xs text-text-muted whitespace-pre-wrap font-mono">{d.content.slice(0, 500)}{d.content.length > 500 ? "…" : ""}</pre></div>))}</div>
              <Button onClick={() => setStep(4)}>Continue →</Button>
            </>)}
            {repoResult && (<>
              <p className="text-text-secondary">{repoResult.summary}</p>
              <p className="text-sm text-text-muted">Paths: {repoResult.paths.join(", ")}</p>
              <a href={`https://github.com/${repoResult.repoId}`} target="_blank" rel="noopener noreferrer" className="text-action-primary hover:underline text-sm">View on GitHub →</a>
              <div><Button onClick={() => setStep(4)}>Continue →</Button></div>
            </>)}
          </div></Card>
        )}

        {step === 4 && (
          <Card elevated><div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-semantic-success-bg flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-semantic-success-text"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div><h3 className="text-lg font-semibold mb-2">Documentation ready</h3>
              <p className="text-text-muted">{status === "existing" ? "For existing repos we keep docs in sync on every push. Add a webhook to enable automatic updates." : "Your docs are ready. Connect a repository to push these docs."}</p>
            </div>
            <Button variant="primary" size="lg" onClick={() => { const p = status === "new_idea" ? ideaResult?.project : repoResult?.project; if (p?.id) router.push(`/projects/${p.id}`); else router.push("/dashboard"); }}>Go to project →</Button>
          </div></Card>
        )}
      </main>
    </div>
  );
}
