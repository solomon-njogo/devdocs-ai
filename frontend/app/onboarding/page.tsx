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

type ProjectStatus = "new_idea" | "existing" | null;

interface NewIdeaResponse {
  project: Project;
  projectName: string;
  docs: { type: string; path: string; content: string }[];
}

interface ReviewRepoResponse {
  project: Project;
  repoId: string;
  paths: string[];
  summary: string;
}

interface GitHubRepoItem {
  fullName: string;
  name: string;
  private: boolean;
  description: string | null;
}

const selectLikeInput =
  "w-full min-h-[48px] bg-bg-primary text-text-primary border border-surface-border rounded-input pl-4 pr-11 py-3 text-base focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all duration-[var(--duration-normal)] disabled:opacity-40 disabled:cursor-not-allowed appearance-none";

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => {
        const s = i + 1,
          done = s < current,
          active = s === current;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${done
                ? "bg-action-primary text-text-on-primary"
                : active
                  ? "bg-action-primary/15 text-action-primary border-2 border-action-primary shadow-[0_0_15px_rgba(var(--action-primary-rgb),0.3)]"
                  : "bg-surface-hover text-text-muted border border-surface-border"
                }`}
            >
              {done ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < total && (
              <div className={`w-8 h-0.5 rounded-full ${done ? "bg-action-primary" : "bg-surface-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const ta =
  "w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-4 py-2.5 text-base placeholder:text-text-faded focus:outline-none focus:ring-2 focus:ring-action-primary/30 focus:border-action-primary transition-all duration-[var(--duration-normal)]";

const LOADING_MESSAGES = [
  "Synthesizing your vision...",
  "Architecting system overview...",
  "Drafting technical specifications...",
  "Generating product requirements...",
  "Building your documentation suite...",
  "Finalizing blueprints...",
];

function EngagingLoader() {
  const [msgIndex, setMsgIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card elevated className="p-16 flex flex-col items-center justify-center text-center space-y-10 animate-fade-in-scale min-h-[500px] overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-surface-border overflow-hidden">
          <div className="h-full bg-action-primary animate-[loading-bar_4s_ease-in-out_infinite]" />
        </div>
      </div>

      <div className="relative">
        <div className="w-24 h-24 rounded-3xl border-2 border-action-primary/20 flex items-center justify-center animate-[spin_10s_linear_infinite]">
          <div className="w-16 h-16 rounded-2xl bg-action-primary/10 animate-pulse flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-action-primary animate-bounce">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
        </div>
        <div className="absolute -inset-4 border border-action-primary/10 rounded-[2.5rem] animate-ping opacity-20" />
      </div>

      <div className="space-y-4 max-w-sm">
        <h3 className="text-2xl font-bold tracking-tight text-white transition-all duration-700 animate-fade-in" key={msgIndex}>
          {LOADING_MESSAGES[msgIndex]}
        </h3>
        <p className="text-text-muted text-sm leading-relaxed">
          Our AI is processing your requirements to build a comprehensive documentation package tailored to your idea.
        </p>
      </div>

      <div className="flex gap-1.5">
        {LOADING_MESSAGES.map((_, i) => (
          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === msgIndex ? "w-8 bg-action-primary" : "w-2 bg-surface-border"}`} />
        ))}
      </div>

      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Card>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState<ProjectStatus>(null);

  // New Idea State
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [features, setFeatures] = useState("");
  const [requirements, setRequirements] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  // Existing Repo State
  const [repoId, setRepoId] = useState("");
  const [githubRepos, setGithubRepos] = useState<GitHubRepoItem[] | null>(null);
  const [githubReposLoading, setGithubReposLoading] = useState(false);
  const [githubReposLoadError, setGithubReposLoadError] = useState<string | null>(null);
  const [manualRepoEntry, setManualRepoEntry] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ideaResult, setIdeaResult] = useState<NewIdeaResponse | null>(null);
  const [repoResult, setRepoResult] = useState<ReviewRepoResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectingGitHub, setConnectingGitHub] = useState(false);

  useEffect(() => {
    if (!connected || status !== "existing" || step !== 2) return;
    let cancelled = false;
    setGithubReposLoading(true);
    setGithubReposLoadError(null);
    void (async () => {
      try {
        const data = await api<{ repos: GitHubRepoItem[] }>("/api/onboarding/github-repos");
        if (cancelled) return;
        setGithubRepos(data.repos);
        if (data.repos.length === 0) setManualRepoEntry(true);
      } catch (e) {
        if (cancelled) return;
        setGithubReposLoadError(e instanceof Error ? e.message : "Could not load repositories.");
        setGithubRepos([]);
        setManualRepoEntry(true);
      } finally {
        if (!cancelled) setGithubReposLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [connected, status, step]);

  const githubRepoListPending =
    connected && status === "existing" && step === 2 && githubRepos === null && !manualRepoEntry;

  useEffect(() => {
    const p = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (p.get("connected") === "1") {
      setConnected(true);
      setStatus("existing");
      setStep(2);
    }
    if (p.get("error") === "oauth_failed") setError("GitHub sign-in failed. Please try again.");
    if (p.get("error") === "missing_code") setError("GitHub did not return a code. Please try again.");
  }, []);

  const handleModeChoice = (c: "new_idea" | "existing") => {
    setStatus(c);
    setError(null);
    setStep(2);
  };

  const handleNewIdeaSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const r = await api<NewIdeaResponse>("/api/onboarding/idea", {
        method: "POST",
        body: {
          projectName: projectName.trim(),
          description: description.trim(),
          features: features.trim() || undefined,
          requirements: requirements.trim() || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
        },
      });
      setIdeaResult(r);
      // Success screen will be at step 6 for new idea
      setStep(6);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      // Stay on current step (5) if error occurs
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const r = await api<ReviewRepoResponse>("/api/onboarding/review-repo", {
        method: "POST",
        body: { repoId: repoId.trim() },
      });
      setRepoResult(r);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const Spinner = () => (
    <span className="w-4 h-4 border-2 border-text-on-primary/30 border-t-text-on-primary rounded-full animate-spin" />
  );

  // New Idea Steps:
  // 1. Choice
  // 2. Name
  // 3. App Idea (Description)
  // 4. Features
  // 5. Requirements & More
  // 6. Generated Result
  // 7. Success

  // Repo Steps:
  // 1. Choice
  // 2. Connect
  // 3. Result
  // 4. Success

  const totalSteps = status === "new_idea" ? 7 : 4;

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary selection:bg-action-primary/30">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-surface-border bg-surface-header/80 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center shadow-lg shadow-action-primary/20 group-hover:scale-105 transition-transform">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight gradient-text">DevDocs AI</span>
          </Link>
          <UserMenu />
        </div>
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-action-primary/30 to-transparent" />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2">Initialize Project</h2>
            <p className="text-text-muted text-sm border-l-2 border-action-primary/30 pl-3">
              {status === "new_idea" ? "Building from concept" : status === "existing" ? "Connecting codebase" : "Let's get started"}
            </p>
          </div>
          <StepDots current={step} total={totalSteps} />
        </div>

        {error && (
          <div className="rounded-xl border border-semantic-error-text/20 bg-semantic-error-bg/30 backdrop-blur-sm px-4 py-3 text-sm text-semantic-error-text mb-8 animate-fade-in-scale flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
          </div>
        )}

        {/* STEP 1: Choice */}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-6 animate-fade-in-scale">
            <button
              type="button"
              onClick={() => handleModeChoice("new_idea")}
              className="group relative p-8 rounded-2xl border border-surface-border hover:border-action-primary/50 bg-bg-secondary hover:bg-action-primary/[0.02] transition-all text-left cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-action-primary/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 rounded-2xl bg-action-primary/10 group-hover:bg-action-primary/20 flex items-center justify-center mb-6 transition-colors shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-action-primary">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2 group-hover:text-action-primary transition-colors">Start with an Idea</h4>
              <p className="text-text-muted text-sm leading-relaxed">
                Describe your project vision and we&apos;ll generate comprehensive technical documentation for you.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleModeChoice("existing")}
              className="group relative p-8 rounded-2xl border border-surface-border hover:border-action-primary/50 bg-bg-secondary hover:bg-action-primary/[0.02] transition-all text-left cursor-pointer overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="w-14 h-14 rounded-2xl bg-action-primary/10 group-hover:bg-action-primary/20 flex items-center justify-center mb-6 transition-colors shadow-inner">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-action-primary">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </div>
              <h4 className="text-xl font-bold mb-2 group-hover:text-action-primary transition-colors">Connect Repository</h4>
              <p className="text-text-muted text-sm leading-relaxed">
                Connect an existing GitHub repository and we&apos;ll analyze it to keep your docs always in sync.
              </p>
            </button>
          </div>
        )}

        {/* NEW IDEA FLOW */}
        {status === "new_idea" && (
          <div className="animate-fade-in">
            {loading ? (
              <EngagingLoader />
            ) : (
              <>
                {step === 2 && (
                  <Card elevated className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">What&apos;s the name of your project?</h3>
                        <p className="text-text-muted">Choose a clear, descriptive name that reflects your app&apos;s identity.</p>
                      </div>
                      <div className="space-y-4">
                        <Input
                          label="Project Name"
                          required
                          autoFocus
                          value={projectName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const titled = val.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
                            setProjectName(titled);
                          }}
                          placeholder="e.g. Phoenix E-commerce, TaskFlow AI"
                          className="text-lg py-6"
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button
                          variant="primary"
                          disabled={!projectName.trim()}
                          onClick={() => setStep(3)}
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {step === 3 && (
                  <Card elevated className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">Tell us about your app Idea</h3>
                        <p className="text-text-muted">Describe the core problem you&apos;re solving and who this app is for.</p>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-text-secondary">Main Concept & Description *</label>
                        <textarea
                          required
                          autoFocus
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="e.g. A marketplace for local artisans to sell handcrafted goods with integrated shipping and reviews..."
                          className={`${ta} min-h-[200px] text-lg leading-relaxed`}
                          rows={8}
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                        <Button
                          variant="primary"
                          disabled={!description.trim()}
                          onClick={() => setStep(4)}
                        >
                          Next: Define Features
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {step === 4 && (
                  <Card elevated className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">Key features and capabilities</h3>
                        <p className="text-text-muted">What are the specific things users can do in your app?</p>
                      </div>
                      <div className="space-y-4">
                        <label className="block text-sm font-medium text-text-secondary">Feature List (Optional)</label>
                        <textarea
                          autoFocus
                          value={features}
                          onChange={(e) => setFeatures(e.target.value)}
                          placeholder="e.g. User authentication, Product search with filters, Stripe integration for payments..."
                          className={`${ta} min-h-[160px]`}
                          rows={6}
                        />
                      </div>
                      <div className="flex gap-4 pt-4">
                        <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                        <Button variant="primary" onClick={() => setStep(5)}>Next: Technical Details</Button>
                      </div>
                    </div>
                  </Card>
                )}

                {step === 5 && (
                  <Card elevated className="p-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold">Technical requirements & more</h3>
                        <p className="text-text-muted">Any specific stack, business rules, or constraints we should include?</p>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">Technical Specs (Optional)</label>
                          <textarea
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="e.g. Needs to use Next.js, PostgreSQL for database, must be accessible (WCAG 2.1)..."
                            className={`${ta} min-h-[100px]`}
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-secondary mb-2">Anything else?</label>
                          <textarea
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder="Additional context or specific formatting preferences..."
                            className={`${ta} min-h-[80px]`}
                            rows={2}
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 pt-6">
                        <Button variant="ghost" onClick={() => setStep(4)}>Back</Button>
                        <Button
                          variant="primary"
                          size="lg"
                          disabled={loading}
                          onClick={handleNewIdeaSubmit}
                          className="shadow-xl shadow-action-primary/20"
                        >
                          Generate Project Documentation
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {step === 6 && ideaResult && (
                  <Card elevated className="p-8">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold text-semantic-success-text">Documentation Blueprint Ready</h3>
                        <div className="px-3 py-1 bg-semantic-success-bg/20 text-semantic-success-text rounded-full text-xs font-bold uppercase tracking-wider">Generated</div>
                      </div>
                      <p className="text-text-secondary">We&apos;ve synthesized your idea into a professional documentation suite for <strong className="text-text-primary">{ideaResult.projectName}</strong>.</p>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ideaResult.docs.map(d => (
                            <div key={d.path} className="flex items-center gap-3 p-4 rounded-xl bg-bg-secondary border border-surface-border">
                              <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center text-action-primary">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold uppercase tracking-widest text-text-faded">{d.type}</span>
                                <span className="text-sm font-medium">{d.path}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="rounded-xl border border-surface-border bg-bg-secondary/50 p-6 max-h-80 overflow-auto divide-y divide-surface-border">
                          {ideaResult.docs.map(d => (
                            <div key={d.path} className="py-4 first:pt-0 last:pb-0">
                              <h4 className="text-xs font-bold text-text-muted mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-action-primary" /> {d.path}
                              </h4>
                              <pre className="text-[13px] text-text-muted leading-relaxed whitespace-pre-wrap font-mono bg-bg-primary/50 p-4 rounded-lg overflow-x-auto border border-surface-border/50">
                                {d.content.slice(0, 800)}{d.content.length > 800 ? "..." : ""}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6">
                        <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => setStep(7)}>
                          Continue to Project →
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {step === 7 && (
                  <Card elevated className="p-10 text-center space-y-8 animate-fade-in-scale">
                    <div className="w-20 h-20 rounded-3xl bg-action-primary/10 flex items-center justify-center mx-auto relative">
                      <div className="absolute inset-0 bg-action-primary/20 rounded-3xl animate-ping opacity-20" />
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-action-primary">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-extrabold tracking-tight">Project Successfully Initialized!</h3>
                      <p className="text-text-muted max-w-md mx-auto leading-relaxed">
                        Your documentation has been generated and your project workspace is ready. You can now connect a repository or refine your docs further.
                      </p>
                    </div>
                    <div className="pt-4">
                      <Button
                        variant="primary"
                        size="lg"
                        className="px-12 rounded-full shadow-2xl shadow-action-primary/30"
                        onClick={() => {
                          if (ideaResult?.project?.id) router.push(`/projects/${ideaResult.project.id}`);
                          else router.push("/dashboard");
                        }}
                      >
                        Enter Workspace
                      </Button>
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* REPO FLOW */}
        {status === "existing" && (
          <div className="animate-fade-in">
            {step === 2 && (
              <Card elevated className="p-8">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Connect your repository</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                      Link your GitHub account to allow DevDocs AI to analyze your codebase and keep documentation in sync.
                    </p>
                  </div>

                  {!connected ? (
                    <div className="p-10 rounded-2xl border-2 border-dashed border-surface-border bg-bg-secondary/30 text-center space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-surface-hover flex items-center justify-center mx-auto mb-2 shadow-inner">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-text-primary">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </div>
                      <div className="space-y-4">
                        <Button
                          variant="primary"
                          size="lg"
                          className="px-8 shadow-xl shadow-action-primary/20"
                          disabled={connectingGitHub}
                          onClick={async () => {
                            setConnectingGitHub(true);
                            setError(null);
                            try {
                              const url = await getAuthGitHubUrl();
                              window.location.href = url;
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Could not start GitHub connect.");
                              setConnectingGitHub(false);
                            }
                          }}
                        >
                          {connectingGitHub ? (
                            <span className="flex items-center gap-2">
                              <Spinner /> Authorizing GitHub...
                            </span>
                          ) : (
                            "Connect GitHub Account"
                          )}
                        </Button>
                        <p className="text-[11px] text-text-faded">We only request read access to your repositories and code.</p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewRepo} className="space-y-8 animate-fade-in-scale">
                      <div className="flex items-center gap-3 text-sm font-medium text-semantic-success-text bg-semantic-success-bg/10 border border-semantic-success-text/20 rounded-xl px-4 py-3">
                        <div className="w-5 h-5 rounded-full bg-semantic-success-text flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>
                        </div>
                        GitHub identity verified
                      </div>
                      <div className="space-y-2">
                        {githubReposLoading || githubRepoListPending ? (
                          <div className="space-y-2">
                            <span className="block text-sm font-medium text-text-secondary">Target Repository</span>
                            <div
                              className={`${selectLikeInput} flex items-center gap-3 text-text-muted text-sm`}
                              aria-busy="true"
                            >
                              <span className="w-4 h-4 border-2 border-action-primary/30 border-t-action-primary rounded-full animate-spin shrink-0" />
                              Loading your GitHub repositories…
                            </div>
                          </div>
                        ) : manualRepoEntry || !githubRepos?.length ? (
                          <div className="space-y-3">
                            <Input
                              label="Target Repository"
                              required
                              autoFocus
                              value={repoId}
                              onChange={(e) => setRepoId(e.target.value)}
                              placeholder="owner/repository"
                              className="text-lg py-6"
                              hint="Format: owner/repo (e.g. acme/mobile-app)"
                            />
                            {githubReposLoadError && (
                              <p className="text-sm text-semantic-error-text" role="alert">
                                {githubReposLoadError}
                              </p>
                            )}
                            {githubRepos && githubRepos.length > 0 && (
                              <button
                                type="button"
                                className="text-sm font-medium text-action-primary hover:text-action-primary-hover"
                                onClick={() => {
                                  setManualRepoEntry(false);
                                  setRepoId("");
                                  setGithubReposLoadError(null);
                                }}
                              >
                                Choose from your repositories instead
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label htmlFor="onboarding-repo-select" className="block text-sm font-medium text-text-secondary">
                              Target Repository
                            </label>
                            <div className="relative">
                              <select
                                id="onboarding-repo-select"
                                required
                                value={repoId}
                                onChange={(e) => setRepoId(e.target.value)}
                                className={`${selectLikeInput} text-lg cursor-pointer`}
                              >
                                <option value="">Select a repository…</option>
                                {githubRepos.map((r) => (
                                  <option key={r.fullName} value={r.fullName}>
                                    {r.fullName}
                                    {r.private ? " · private" : ""}
                                  </option>
                                ))}
                              </select>
                              <span
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
                                aria-hidden
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M6 9l6 6 6-6" />
                                </svg>
                              </span>
                            </div>
                            <p className="text-sm text-text-muted">
                              Repositories you own, collaborate on, or access via an organization.
                            </p>
                            <button
                              type="button"
                              className="text-sm font-medium text-action-primary hover:text-action-primary-hover"
                              onClick={() => {
                                setManualRepoEntry(true);
                                setRepoId("");
                              }}
                            >
                              Enter owner/repo manually
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-4 pt-4 border-t border-surface-border">
                        <Button type="button" variant="ghost" onClick={() => setStep(1)}>Back</Button>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={loading || !repoId.trim()}
                          className="shadow-lg shadow-action-primary/20"
                        >
                          {loading ? (
                            <span className="flex items-center gap-3">
                              <Spinner /> Analyzing Repository...
                            </span>
                          ) : (
                            "Review and Setup Pipeline"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </Card>
            )}

            {step === 3 && repoResult && (
              <Card elevated className="p-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Repository Analysis Complete</h3>
                    <p className="text-text-secondary leading-relaxed">{repoResult.summary}</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-bg-secondary border border-surface-border space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-text-faded">Detected File Structure</h4>
                    <div className="flex flex-wrap gap-2">
                      {repoResult.paths.slice(0, 15).map(p => (
                        <span key={p} className="px-2.5 py-1 bg-bg-primary border border-surface-border rounded-lg text-xs font-mono text-text-muted">
                          {p}
                        </span>
                      ))}
                      {repoResult.paths.length > 15 && (
                        <span className="px-2.5 py-1 text-xs text-text-faded">+{repoResult.paths.length - 15} more files</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-6">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => setStep(4)}>
                      Finalize Setup
                    </Button>
                    <a
                      href={`https://github.com/${repoResult.repoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-action-primary hover:text-action-primary-hover font-medium text-sm flex items-center gap-2 px-4 transition-colors"
                    >
                      View Codebase on GitHub <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                  </div>
                </div>
              </Card>
            )}

            {step === 4 && (
              <Card elevated className="p-10 text-center space-y-8 animate-fade-in-scale">
                <div className="w-20 h-20 rounded-3xl bg-semantic-success-bg/20 flex items-center justify-center mx-auto">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-semantic-success-text">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-extrabold tracking-tight text-white">Pipeline Activated</h3>
                  <p className="text-text-muted max-w-md mx-auto leading-relaxed text-sm">
                    We&apos;ve successfully connected to <strong className="text-text-primary">{repoId}</strong>. Your documentation will stay in sync automatically whenever you push new code.
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    variant="primary"
                    size="lg"
                    className="px-12 rounded-full shadow-2xl shadow-action-primary/30"
                    onClick={() => {
                      if (repoResult?.project?.id) router.push(`/projects/${repoResult.project.id}`);
                      else router.push("/dashboard");
                    }}
                  >
                    Go to Project Dashboard
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Decorative background elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-action-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
        <div className="absolute top-[40%] left-[20%] w-[20%] h-[20%] bg-purple-600/5 blur-[80px] rounded-full opacity-50" />
      </div>
    </div>
  );
}
