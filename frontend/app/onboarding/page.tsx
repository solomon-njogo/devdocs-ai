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
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    if (params.get("connected") === "1") setConnected(true);
    if (params.get("error") === "oauth_failed") setError("GitHub sign-in failed. Please try again.");
    if (params.get("error") === "missing_code") setError("GitHub did not return a code. Please try again.");
  }, []);

  const handleStep1 = (choice: "new_idea" | "existing") => {
    setStatus(choice);
    setError(null);
    setStep(2);
  };

  const handleNewIdeaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api<NewIdeaResponse>("/api/onboarding/idea", {
        method: "POST",
        body: {
          projectName: projectName.trim(),
          description: description.trim(),
          features: features.trim() || undefined,
          requirements: requirements.trim() || undefined,
          additionalInfo: additionalInfo.trim() || undefined,
        },
      });
      setIdeaResult(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api<ReviewRepoResponse>("/api/onboarding/review-repo", {
        method: "POST",
        body: { repoId: repoId.trim() },
      });
      setRepoResult(result);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <header className="flex items-center justify-between flex-wrap gap-2">
          <Link href="/" className="text-lg font-semibold text-action-primary hover:underline">
            DevDocs AI
          </Link>
          <div className="flex items-center gap-3">
            <UserMenu />
            <span className="text-sm text-text-muted">
              Step {step} of 4
            </span>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-semantic-error-text/50 bg-semantic-error-bg px-4 py-3 text-sm text-semantic-error-text">
            {error}
          </div>
        )}

        {/* Step 1: Select project status */}
        {step === 1 && (
          <Card title="Get started" elevated>
            <p className="text-text-secondary mb-6">
              Are you working on a new idea or an existing project?
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => handleStep1("new_idea")}
              >
                New idea
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="flex-1"
                onClick={() => handleStep1("existing")}
              >
                Existing project
              </Button>
            </div>
          </Card>
        )}

        {/* Step 2a: New idea form */}
        {step === 2 && status === "new_idea" && (
          <Card title="Describe your idea" elevated>
            <form onSubmit={handleNewIdeaSubmit} className="flex flex-col gap-4">
              <Input
                label="Project name"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My App"
              />
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is your project about?"
                  className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[120px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg-primary"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Features (optional)
                </label>
                <textarea
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Key features you have in mind"
                  className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[80px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Requirements (optional)
                </label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="Technical or business requirements"
                  className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[80px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1.5">
                  Additional info (optional)
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Anything else relevant for planning"
                  className="w-full bg-bg-primary text-text-primary border border-surface-border rounded-input px-3 py-2 text-base min-h-[60px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={2}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Generating…" : "Review and generate docs"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Step 2b: Existing — Connect GitHub */}
        {step === 2 && status === "existing" && (
          <Card title="Connect your repository" elevated>
            {!connected ? (
              <>
                <p className="text-text-secondary mb-4">
                  Connect your GitHub account so we can read your repo and push generated docs.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  disabled={connectingGitHub}
                  onClick={async () => {
                    setConnectingGitHub(true);
                    setError(null);
                    try {
                      const url = await getAuthGitHubUrl();
                      window.location.href = url;
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not start GitHub connect. Please try again.");
                      setConnectingGitHub(false);
                    }
                  }}
                >
                  {connectingGitHub ? "Redirecting…" : "Connect GitHub"}
                </Button>
              </>
            ) : (
              <form onSubmit={handleReviewRepo} className="flex flex-col gap-4">
                <p className="text-semantic-success-text text-sm mb-2">GitHub connected.</p>
                <Input
                  label="Repository"
                  required
                  value={repoId}
                  onChange={(e) => setRepoId(e.target.value)}
                  placeholder="owner/repo"
                  hint="Format: owner/repo (e.g. octocat/Hello-World)"
                />
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Generating…" : "Review and generate docs"}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        )}

        {/* Step 3: Review and generate result */}
        {step === 3 && (
          <Card title="Generated documentation" elevated>
            {ideaResult && (
              <div className="flex flex-col gap-4">
                <p className="text-text-secondary">
                  We generated the following for <strong>{ideaResult.projectName}</strong>:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  {ideaResult.docs.map((d) => (
                    <li key={d.path}>
                      <span className="font-medium text-text-primary">{d.type}</span> — {d.path}
                    </li>
                  ))}
                </ul>
                <div className="rounded-md border border-surface-border bg-bg-primary p-4 max-h-60 overflow-auto space-y-4">
                  {ideaResult.docs.map((d) => (
                    <div key={d.path}>
                      <h4 className="text-sm font-semibold text-text-primary mb-2">{d.path}</h4>
                      <pre className="text-xs text-text-muted whitespace-pre-wrap font-mono">
                        {d.content.slice(0, 500)}
                        {d.content.length > 500 ? "…" : ""}
                      </pre>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => {
                    setStep(4);
                  }}
                >
                  Continue
                </Button>
              </div>
            )}
            {repoResult && (
              <div className="flex flex-col gap-4">
                <p className="text-text-secondary">{repoResult.summary}</p>
                <p className="text-sm text-text-muted">
                  Paths: {repoResult.paths.join(", ")}
                </p>
                <a
                  href={`https://github.com/${repoResult.repoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-action-primary hover:underline"
                >
                  View repository on GitHub
                </a>
                <Button
                  onClick={() => {
                    setStep(4);
                  }}
                >
                  Continue
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Step 4: Doc sync */}
        {step === 4 && (
          <Card title="Documentation sync" elevated>
            <p className="text-text-secondary mb-4">
              {status === "existing"
                ? "For existing repos we keep docs in sync on every push. Add a webhook in your repo settings pointing to this app to enable automatic doc updates."
                : "Your docs are ready. When you create or connect a repository, you can push these docs to it from the app."}
            </p>
            <Button
              variant="primary"
              onClick={() => {
                router.push("/");
              }}
            >
              Done
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
