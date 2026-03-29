"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { UserMenu } from "@/components/UserMenu";

export default function PRDGeneratorPage() {
    const [prompt, setPrompt] = useState("");
    const [generating, setGenerating] = useState(false);
    const [output, setOutput] = useState("");

    const handleGenerate = () => {
        if (!prompt.trim()) return;
        setGenerating(true);
        // Mock generation for UI demonstration
        setTimeout(() => {
            setOutput(`# PRD: ${prompt}\n\n## 1. Executive Summary\nThis document outlines the requirements and strategy for...\n\n## 2. Goals & Objectives\n- Streamline documentation workflow\n- Enhance collaboration\n\n## 3. User Stories\n- As a dev, I want to sync code with docs...`);
            setGenerating(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#070708] text-white flex flex-col font-sans">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-action-primary/10 blur-[120px] rounded-full -translate-y-1/2" />
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full translate-y-1/2" />
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070708]/80 backdrop-blur-xl">
                <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="flex items-center gap-2 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="15 18 9 12 15 6" />
                                </svg>
                            </div>
                            <span className="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">Back to Dashboard</span>
                        </Link>
                        <div className="h-6 w-px bg-white/10" />
                        <h1 className="text-sm font-bold tracking-tight uppercase text-text-faded">AI PRD Generator</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-[11px] font-medium text-action-primary">
                            <div className="w-1.5 h-1.5 rounded-full bg-action-primary animate-pulse"></div>
                            GPT-4 Turbo Active
                        </div>
                        <UserMenu />
                    </div>
                </div>
            </header>

            {/* Main Content: Two-Pane Layout */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Pane: Input/Configuration */}
                <section className="w-[450px] border-r border-white/5 p-8 overflow-y-auto bg-[#09090b]/50">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">Configure</h2>
                        <p className="text-text-muted text-sm leading-relaxed">
                            Describe your project idea in detail. The AI will generate a structured PRD based on best practices.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-text-faded uppercase tracking-widest mb-3">Project Description</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A mobile app for tracking daily water intake with social gamification features..."
                                className="w-full h-48 bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-action-primary/50 transition-colors resize-none leading-relaxed"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-faded uppercase tracking-widest mb-3">Tone</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-text-muted focus:outline-none focus:border-action-primary/50">
                                    <option>Professional</option>
                                    <option>Technical</option>
                                    <option>Creative</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-faded uppercase tracking-widest mb-3">Framework</label>
                                <select className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-text-muted focus:outline-none focus:border-action-primary/50">
                                    <option>Agile PRD</option>
                                    <option>Product Brief</option>
                                    <option>Full Documentation</option>
                                </select>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full rounded-xl shadow-lg shadow-action-primary/20 mt-4"
                            disabled={generating || !prompt.trim()}
                            onClick={handleGenerate}
                        >
                            {generating ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Generating...
                                </div>
                            ) : "Generate PRD"}
                        </Button>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <h3 className="text-xs font-bold text-text-faded uppercase tracking-widest mb-4">Recommended Components</h3>
                            <div className="space-y-2">
                                {["User Journey Map", "Tech Stack Analysis", "Competitive Landscape"].map(item => (
                                    <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 cursor-pointer group transition-all">
                                        <span className="text-xs text-text-muted group-hover:text-text-primary">{item}</span>
                                        <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center text-[10px]">+</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Right Pane: Live Output/Editor */}
                <section className="flex-1 p-8 bg-[#070708] overflow-y-auto relative">
                    {!output && !generating ? (
                        <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center">
                            <div className="w-20 h-20 rounded-3xl bg-action-primary/5 flex items-center justify-center mb-8 border border-action-primary/10">
                                <span className="text-4xl">✨</span>
                            </div>
                            <h3 className="text-xl font-bold mb-3">Awaiting your brilliance</h3>
                            <p className="text-text-muted leading-relaxed">
                                Set up your project details on the left, and watch your PRD come to life here in real-time.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto pb-24">
                            {/* Output Toolbar */}
                            <div className="sticky top-0 bg-[#070708]/80 backdrop-blur pb-6 mb-8 flex items-center justify-between border-b border-white/5 z-10">
                                <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${generating ? "bg-amber-500/10 text-amber-500" : "bg-action-success/10 text-action-success"}`}>
                                        {generating ? "Crafting..." : "Finalized"}
                                    </div>
                                    <span className="text-xs text-text-muted">ID: PRD-092-AX</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" className="bg-white/5 border-white/10">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                        </svg>
                                        Copy
                                    </Button>
                                    <Button variant="secondary" size="sm" className="bg-white/5 border-white/10">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                        </svg>
                                        Export
                                    </Button>
                                </div>
                            </div>

                            {/* Render Area */}
                            <article className="prose prose-invert prose-emerald max-w-none">
                                {generating ? (
                                    <div className="space-y-6">
                                        <div className="h-10 w-2/3 bg-white/5 animate-pulse rounded"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 w-full bg-white/5 animate-pulse rounded"></div>
                                            <div className="h-4 w-5/6 bg-white/5 animate-pulse rounded"></div>
                                            <div className="h-4 w-4/6 bg-white/5 animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-48 w-full bg-white/5 animate-pulse rounded-xl"></div>
                                        <div className="h-10 w-1/2 bg-white/5 animate-pulse rounded"></div>
                                    </div>
                                ) : (
                                    <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-text-primary">
                                        {output}
                                    </div>
                                )}
                            </article>
                        </div>
                    )}

                    {/* Glass floating alert for 'AI Confidence' */}
                    {output && !generating && (
                        <div className="absolute bottom-8 right-8 p-4 rounded-xl bg-[#1a1a1c]/80 backdrop-blur border border-white/10 shadow-2xl max-w-xs animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-action-primary/20 flex items-center justify-center text-action-primary">✨</div>
                                <span className="text-sm font-bold text-white">AI Analysis Done</span>
                            </div>
                            <p className="text-[11px] text-text-muted leading-relaxed">
                                Confidence score: 98.4%. PRD is ready for stakeholder review. No critical gaps identified in user stories.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
