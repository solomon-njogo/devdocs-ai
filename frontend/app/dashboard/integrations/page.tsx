"use client";
import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserMenu } from "@/components/UserMenu";
import { getIntegrationStatus, type AllIntegrationsStatus, getAuthGitHubUrl } from "@/lib/api";

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<AllIntegrationsStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getIntegrationStatus()
            .then(setIntegrations)
            .catch(err => {
                console.error(err);
                setError("Failed to load integrations status.");
            })
            .finally(() => setLoading(false));
    }, []);

    const handleConnect = async (name: string) => {
        if (name === "GitHub") {
            try {
                const url = await getAuthGitHubUrl();
                window.location.assign(url);
            } catch (err) {
                console.error(err);
                setError("Failed to start GitHub authentication.");
            }
        } else {
            // For now, these are not implemented
            alert(`${name} integration coming soon!`);
        }
    };

    return (
        <div className="min-h-screen bg-[#070708] text-text-primary flex flex-col">
            <header className="sticky top-0 z-[50] border-b border-white/5 bg-[#070708]/80 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-action-primary flex items-center justify-center">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <span className="font-bold text-lg tracking-tight">DevDocs AI</span>
                        </Link>
                    </div>
                    <UserMenu />
                </div>
            </header>

            <main className="flex-1 p-8 max-w-4xl mx-auto w-full">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary mb-2">Integrations</h1>
                    <p className="text-text-muted">Manage your connections to external services.</p>
                </div>

                {error && (
                    <div className="p-4 mb-6 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="p-4 mb-6 rounded-xl border border-white/10 bg-white/[0.03] text-text-muted text-sm">
                        Loading integrations…
                    </div>
                )}

                <div className="grid gap-6">
                    <IntegrationCard
                        name="GitHub"
                        description="Connect to your GitHub repositories to sync documentation."
                        icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>}
                        connected={integrations?.github.connected || false}
                        onConnect={() => handleConnect("GitHub")}
                    />
                    <IntegrationCard
                        name="GitLab"
                        description="Sync with your GitLab projects and issues. (Coming Soon)"
                        icon={<span className="text-xl">🦊</span>}
                        connected={integrations?.gitlab.connected || false}
                        onConnect={() => handleConnect("GitLab")}
                    />
                    <IntegrationCard
                        name="Linear"
                        description="Link documentation to your Linear issues and cycles. (Coming Soon)"
                        icon={<span className="text-xl">📈</span>}
                        connected={integrations?.linear.connected || false}
                        onConnect={() => handleConnect("Linear")}
                    />
                </div>
            </main>
        </div>
    );
}

function IntegrationCard({ name, description, icon, connected, onConnect }: { name: string, description: string, icon: ReactNode, connected: boolean, onConnect: () => void }) {
    return (
        <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-text-muted">
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="text-sm text-text-muted">{description}</p>
                </div>
            </div>
            <Button
                variant={connected ? "secondary" : "primary"}
                size="sm"
                className="rounded-full"
                onClick={onConnect}
            >
                {connected ? "Connected" : "Connect"}
            </Button>
        </div>
    );
}
