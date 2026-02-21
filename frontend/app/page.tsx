
"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";

/* ──────────────── Animated counter hook ──────────────── */
function useCountUp(target: number, duration = 2000, start = false) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (!start) return;
        let raf: number;
        const t0 = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - t0) / duration, 1);
            setCount(Math.floor(progress * target));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration, start]);
    return count;
}

/* ──────────────── Intersection Observer hook ──────────────── */
function useInView(threshold = 0.15) {
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [inView, setInView] = useState(false);

    const setRef = useCallback((node: HTMLDivElement | null) => {
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }
        if (node) {
            const obs = new IntersectionObserver(
                ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
                { threshold }
            );
            obs.observe(node);
            observerRef.current = obs;
        }
    }, [threshold]);

    return { setRef, inView };
}

/* ──────────────── Feature card data ──────────────── */
const features = [
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
        ),
        title: "AI-Powered Generation",
        description: "Transform ideas and repos into comprehensive PRDs, user stories, and technical documentation in seconds.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
        ),
        title: "Beautiful Documentation",
        description: "Automatically structured, markdown-rendered docs that are readable by both humans and AI agents.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
        ),
        title: "GitHub Integration",
        description: "Connect your repositories and let DevDocs analyze your codebase to generate context-aware documentation.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
        ),
        title: "Project Dashboard",
        description: "Manage all your documentation projects from a single, elegant dashboard with instant access.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        title: "Secure & Private",
        description: "Your code never leaves your control. Authentication-protected projects with end-to-end security.",
    },
    {
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
        ),
        title: "Fully Customizable",
        description: "Tailor every detail—from doc structure to templates—to match your team's workflow and needs.",
    },
];

/* ──────────────── How-it-works steps ──────────────── */
const steps = [
    { num: "01", title: "Connect or Describe", desc: "Link a GitHub repo or describe your project idea in plain text." },
    { num: "02", title: "AI Analyzes", desc: "Our AI engine analyzes your codebase or concept to understand architecture & intent." },
    { num: "03", title: "Docs Generated", desc: "Beautiful PRDs, user stories, and technical docs are generated instantly." },
    { num: "04", title: "Iterate & Ship", desc: "Review, refine, and share your documentation—kept always up to date." },
];

/* ════════════════ LANDING PAGE ════════════════ */
export default function LandingPage() {
    const [mounted, setMounted] = useState(false);
    const { setRef: statsRefCallback, inView: statsInView } = useInView(0.3);
    const projects = useCountUp(1200, 2000, statsInView);
    const docs = useCountUp(15000, 2500, statsInView);
    const devs = useCountUp(3200, 2000, statsInView);

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
    }, []);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-action-primary selection:text-white">
            {/* ─── Ambient background effects ─── */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
                <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-action-primary/10 to-transparent pointer-events-none" />
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-sky-200/30 dark:bg-sky-900/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-20 -left-20 w-[400px] h-[400px] bg-action-primary/20 dark:bg-action-primary/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* ═══════ NAV ═══════ */}
            <nav className="sticky top-0 z-[var(--z-sticky)] border-b border-surface-border bg-surface-header backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center shadow-lg shadow-action-primary-glow group-hover:shadow-glow transition-shadow duration-300">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                        </div>
                        <span className="text-lg font-bold gradient-text">DevDocs AI</span>
                    </Link>

                    {/* Nav links (desktop) */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm text-text-muted hover:text-text-primary transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm text-text-muted hover:text-text-primary transition-colors">How It Works</a>
                        <a href="#stats" className="text-sm text-text-muted hover:text-text-primary transition-colors">Results</a>
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Log in</Button>
                        </Link>
                        <Link href="/login">
                            <Button variant="primary" size="sm">Get Started Free</Button>
                        </Link>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-action-primary/40 to-transparent" />
            </nav>

            {/* ═══════ HERO ═══════ */}
            <section className="relative z-10 pt-24 pb-20 md:pt-36 md:pb-32">
                <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
                    {/* Badge */}
                    <div
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-badge border border-action-primary/30 bg-action-primary/[0.08] text-sm text-action-primary font-medium mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                            }`}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-action-primary opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-action-primary" />
                        </span>
                        AI-Powered Documentation Platform
                    </div>

                    {/* Headline */}
                    <h1
                        className={`text-5xl md:text-7xl font-bold tracking-tight text-text-primary mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        <span className="text-text-primary">The Intelligent</span>
                        <br />
                        <span className="gradient-text bg-gradient-to-r from-action-primary to-emerald-400 bg-clip-text text-transparent">Knowledge Platform</span>
                    </h1>

                    {/* Sub-headline */}
                    <p
                        className={`max-w-2xl mx-auto text-xl text-text-muted leading-relaxed mb-10 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        Helping engineering teams create and maintain world-class documentation built for both humans and AI agents.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className={`flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto w-full mb-16 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        <div className="relative w-full">
                            <input
                                className="w-full pl-5 pr-32 py-4 rounded-full border border-surface-border bg-bg-secondary text-text-primary focus:ring-2 focus:ring-action-primary focus:border-transparent shadow-sm outline-none"
                                placeholder="Enter your work email"
                                type="email"
                            />
                            <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-action-primary hover:bg-action-primary-hover text-white px-6 rounded-full text-sm font-medium transition-colors">
                                Start now
                            </button>
                        </div>
                    </div>

                    {/* Hero visual — Mock terminal/code window */}
                    <div
                        className={`mt-16 relative mx-auto max-w-5xl transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
                            }`}
                    >
                        <div className="absolute -inset-1 bg-gradient-to-r from-action-primary to-sky-400 rounded-2xl blur opacity-30 dark:opacity-40"></div>
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-surface-border bg-bg-tertiary">
                            <div className="h-10 bg-bg-tertiary border-b border-surface-border flex items-center px-4 gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <div className="mx-auto text-xs text-text-faded font-mono">docs.devdocs.ai</div>
                            </div>
                            <div className="flex h-[500px] text-left">
                                <div className="w-64 border-r border-surface-border bg-bg-secondary p-4 hidden md:block">
                                    <div className="space-y-6">
                                        <div>
                                            <div className="text-xs font-semibold text-text-faded uppercase tracking-wider mb-2">Platform</div>
                                            <ul className="space-y-2 text-sm text-text-muted">
                                                <li className="flex items-center gap-2 text-action-primary bg-action-primary/10 p-2 rounded"><span className="w-4 h-4">⚡</span> Quickstart</li>
                                                <li className="flex items-center gap-2 p-2 hover:text-text-primary cursor-pointer"><span>📊</span> Architecture</li>
                                                <li className="flex items-center gap-2 p-2 hover:text-text-primary cursor-pointer"><span>📦</span> Components</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-[#0f0f11] p-8 overflow-hidden relative">
                                    <div className="max-w-3xl mx-auto">
                                        <div className="flex items-center gap-2 text-action-primary text-sm mb-4 font-mono">Guides / Getting Started</div>
                                        <h2 className="text-3xl font-bold text-white mb-4">Quickstart Guide</h2>
                                        <p className="text-slate-400 mb-8 leading-relaxed">Start building intelligent documentation in under five minutes. Our AI agents will scan your codebase and suggest structure.</p>
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="p-4 rounded-xl bg-bg-tertiary border border-surface-border hover:border-action-primary/50 transition-colors group cursor-pointer text-white">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">🚀</div>
                                                <h3 className="font-medium mb-1">Quickstart</h3>
                                                <p className="text-xs text-slate-500">Deploy your first docs site in minutes.</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-bg-tertiary border border-surface-border hover:border-action-primary/50 transition-colors group cursor-pointer text-white">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">💻</div>
                                                <h3 className="font-medium mb-1">Installation</h3>
                                                <p className="text-xs text-slate-500">Install the CLI to preview locally.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-lg bg-bg-tertiary border border-surface-border font-mono text-xs text-slate-300">
                                            <div className="flex justify-between items-center mb-2 border-b border-surface-border pb-2 text-slate-500">
                                                <span>Terminal</span>
                                                <span className="cursor-pointer hover:text-white">📋</span>
                                            </div>
                                            <span className="text-action-primary">$</span> npm install -g devdocs-cli<br />
                                            <span className="text-action-primary">$</span> devdocs init
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 right-8 w-80 bg-bg-secondary border border-surface-border rounded-xl shadow-2xl p-4 animate-bounce-slow">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-action-primary to-teal-300 flex items-center justify-center">✨</div>
                                            <div>
                                                <div className="text-sm font-medium text-white">AI Assistant</div>
                                                <div className="text-xs text-action-primary">Generating update...</div>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-border rounded-full overflow-hidden">
                                            <div className="h-full bg-action-primary w-2/3 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ TRUSTED BY / STATS ═══════ */}
            <section id="stats" ref={statsRefCallback} className="relative z-10 py-16 border-t border-b border-surface-border bg-bg-secondary/50">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <p className="text-center text-sm font-medium text-text-faded uppercase tracking-widest mb-10">TRUSTED BY INNOVATIVE ENGINEERING TEAMS</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {["Vercel", "Coinbase", "AWS", "Linear", "OpenAI", "Supabase"].map((logo) => (
                            <div key={logo} className="flex items-center gap-2 text-xl font-bold text-text-primary">
                                {logo}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section id="features" className="relative z-10 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-base text-action-primary font-semibold tracking-wide uppercase">End-to-End Workflow</h2>
                        <p className="mt-2 text-3xl leading-[1.2] font-bold tracking-tight text-text-primary sm:text-4xl">
                            Built for the Intelligence Age
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-text-muted mx-auto">
                            Integrate AI into every part of your docs lifecycle. Woven into how your knowledge is written, maintained, and understood.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feat, i) => (
                            <FeatureCard key={feat.title} feat={feat} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ WORKFLOW SECTIONS ═══════ */}
            <section className="py-24 bg-bg-primary relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-8 mb-8">
                        {/* Built for people and AI */}
                        <div className="bg-bg-secondary rounded-3xl p-8 border border-surface-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-6 inline-flex items-center justify-center p-3 bg-action-primary/10 rounded-xl text-action-primary">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-4">Built for both people and AI</h3>
                            <p className="text-text-muted mb-8 text-lg">
                                Ensure your product shows up in the AI workflows users already rely on. We support llms.txt, MCP, and whatever comes next.
                            </p>
                            <div className="bg-bg-tertiary/40 rounded-xl p-6 border border-surface-border relative overflow-hidden min-h-[200px] flex items-center justify-center">
                                <div className="relative w-full max-w-[280px]">
                                    <div className="bg-bg-secondary rounded-lg shadow-lg border border-surface-border p-4 relative z-10">
                                        <div className="flex items-center gap-3 mb-3 border-b border-surface-border pb-3">
                                            <div className="w-2 h-2 rounded-full bg-action-success"></div>
                                            <div className="h-2 w-20 bg-surface-border rounded"></div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-2 w-full bg-surface-border rounded"></div>
                                            <div className="h-2 w-3/4 bg-surface-border rounded"></div>
                                        </div>
                                        <div className="mt-4 flex justify-end">
                                            <div className="px-2 py-1 bg-surface-border rounded text-[10px] text-text-muted font-mono">llms.txt</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Self-updating knowledge */}
                        <div className="bg-bg-secondary rounded-3xl p-8 border border-surface-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-6 inline-flex items-center justify-center p-3 bg-blue-100/10 rounded-xl text-blue-500">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6"></path><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-4">Self-updating knowledge</h3>
                            <p className="text-text-muted mb-8 text-lg">
                                Draft, edit, and maintain content with a context-aware agent. Move faster and more consistently without the documentation debt.
                            </p>
                            <div className="bg-bg-tertiary/40 rounded-xl p-6 border border-surface-border relative overflow-hidden min-h-[200px] flex items-center justify-center">
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-action-success text-white flex items-center justify-center shadow-lg shadow-action-success/20">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                        </div>
                                        <span className="text-xs font-medium text-text-faded">Docs</span>
                                    </div>
                                    <div className="h-px w-8 bg-surface-border"></div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-action-primary text-white flex items-center justify-center shadow-lg shadow-action-primary/20 animate-pulse">
                                            ✨
                                        </div>
                                        <span className="text-xs font-medium text-text-faded">Syncing</span>
                                    </div>
                                    <div className="h-px w-8 bg-surface-border"></div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-bg-tertiary text-text-faded flex items-center justify-center border-2 border-dashed border-surface-border">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                                        </div>
                                        <span className="text-xs font-medium text-text-faded">Code</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ ENTERPRISE REINVENTION ═══════ */}
            <section className="py-24 bg-bg-secondary border-t border-surface-border">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="lg:w-1/2">
                            <div className="text-xs font-bold text-action-primary tracking-widest uppercase mb-4">Enterprise-Reinvention</div>
                            <h2 className="text-4xl font-bold text-text-primary mb-6">Bring intelligence to <br />enterprise knowledge</h2>
                            <p className="text-lg text-text-muted mb-8">
                                Modernize without the rebuild with enterprise-grade professional service & security.
                            </p>
                            <div className="space-y-8">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-action-primary/10 flex items-center justify-center text-action-primary font-bold">🤝</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-text-primary mb-2">Build with partnership</h4>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            Direct, white-glove access to our documentation experts. Dedicated migration support and guidance tailored to your setup.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100/10 flex items-center justify-center text-blue-500 font-bold">🛡️</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-text-primary mb-2">Compliance and access control</h4>
                                        <p className="text-text-muted text-sm leading-relaxed">
                                            Compliant with SOC 2, and in the process for ISO/27001 and GDPR compliance to meet your internal requirements.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10">
                                <Button variant="secondary" size="lg" className="rounded-full">
                                    Explore for enterprise
                                </Button>
                            </div>
                        </div>
                        <div className="lg:w-1/2 w-full">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl group h-[500px]">
                                <img
                                    alt="Abstract architectural landscape"
                                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9B90wCVw3bKQj8nClIIrCapvG7e2zz7o4P-CoyvsB7ZI-WAEcSYc589l-FjPxlIIqcb-2FGZbwYPCNQrjLnjreuJDaJXt_q09t-hAiJ1YqmbxOJVpDDojSr1IoR2hsHstywST56JjZ-aP3eFWJwI1evTh9PBi8dsiQ8JdxthjD7tAM-lGiv8rZx1qt4K_x_BjyZUvFYsHwXtjPAtq3JSnEWxmlmjP9pqmeulXXuP5NQcUItzZRFkZ2PLvfDQi_Tzfn9PC8BeRaH7_"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/40 to-transparent opacity-90"></div>
                                <div className="absolute bottom-0 left-0 p-8 w-full z-10">
                                    <div className="text-xs font-bold text-action-primary mb-2 uppercase tracking-wide">Customer Story</div>
                                    <h3 className="text-2xl font-bold text-white mb-4">See how Anthropic accelerates <br /> AI development with DevDocs</h3>
                                    <div className="flex items-center gap-2 text-white/80 text-sm hover:text-white cursor-pointer transition-colors mb-8">
                                        Read story <span>→</span>
                                    </div>
                                    <div className="flex items-end gap-12 border-t border-white/10 pt-6">
                                        <div>
                                            <div className="text-4xl font-bold text-white mb-1">2M+</div>
                                            <div className="text-xs text-white/60">Monthly active developers</div>
                                        </div>
                                        <div>
                                            <div className="text-4xl font-bold text-white mb-1">3+</div>
                                            <div className="text-xs text-white/60">Products serviced</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ CUSTOMERS ═══════ */}
            <section className="py-24 bg-bg-primary">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-xs font-bold text-action-primary tracking-widest uppercase mb-4">Customers</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-text-primary">Unlock knowledge for any industry</h3>
                        <p className="mt-4 text-text-muted max-w-2xl mx-auto">From frontier AI companies to consumer brands, leaders across industries scale with DevDocs.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            { name: "Perplexity", title: "How Perplexity transformed its documentation", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgBAe5PEPMJ6DfTFp1YNFNbVpP_XZ7DmZq4bJ7dcVnJzCVM_nCQ6EFCCC-6bRrEvsAzk_5qP062Z0YPZxfgNAgmq3uRtBHUSAWLySshzZtxZe6Ulh9OiwFD6XPghXob4k4BOgM7qYJhPyKoS6O4vERCR59VJ9PH89vTbIFrYQ9BPGPTg1Sq2KErFWYxW4dN2jcBYLPitnRg5IB_SnFMwoFQNUl0eGwJl3U8kQXKY5qoyuJWXVCR1mfV0sHB-CUDJh7Rnd-Dv7V54Ri" },
                            { name: "X", title: "How X is using DevDocs to power the developer experience", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDE-OEudg4fyY9FWZJOt2gbNMTlag8da-WKJiI-R8StNKhEATRH0y8qH_vSyqOF6bJqzRHJOHcVDclWSkQ2Tvo5To4D3CWXKkWohCeAwkr5-H9GhyFPW-Fv0nsUNQ9jGjZ0-FsX3RmW8H11h36teXyiUkEBchNg3X8Y_upDD_8VG9QsiT3jkhmVHYe1oK-I9BNLmXfK4FYBqzYCwKJMR_2jSW0QcmBNewz2YnR0JQjTzV9Pivjkaq5YgrFZraPA0gJQfrzBK_ynakNy" },
                            { name: "Kalshi", title: "How Kalshi helps developers drive broader prediction markets", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCBT64ANp3o2UluoechV7d525D3cma_vNk90oKfPGiLwOT_1Y6kICERPBkKEcupVLBrq03oChLNkbdk_GXhX8FmNboQbb6YbStgJiXXqsfx1eXOiR4Tlu4FfOZJjwHAUp4qgZQpiiUfjNtyywcHiW0WWHbW2RhX1i0vW0x_vKVpY47ZgpC1tryTp4dNSWQRkQX4MstrAQ_zLz5m4ZOK0no_quqVs-89uwqu_ib1P7hGG-5P-Lje6lJXxtGmeJy3XCmvQ4wWjFmWs-n9" }
                        ].map((customer) => (
                            <div key={customer.name} className="group cursor-pointer">
                                <div className="rounded-2xl overflow-hidden bg-bg-tertiary aspect-video relative mb-4">
                                    <img
                                        alt={customer.name}
                                        className="object-cover w-full h-full opacity-60 group-hover:scale-105 transition-transform duration-500"
                                        src={customer.img}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white font-bold text-xl tracking-tight uppercase">{customer.name}</span>
                                    </div>
                                </div>
                                <h4 className="text-sm font-semibold text-text-primary mb-1">{customer.title}</h4>
                                <div className="text-xs text-text-faded flex items-center gap-1 group-hover:text-action-primary transition-colors">
                                    Read story <span>→</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FINAL CTA ═══════ */}
            <section className="relative z-10 py-24 md:py-32">
                <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
                    {/* Glow */}
                    <div className="absolute inset-0 mx-auto max-w-lg top-1/2 -translate-y-1/2 h-48 rounded-full bg-action-primary/[0.08] blur-3xl" />
                    <div className="relative">
                        <h2 className="text-3xl md:text-5xl font-bold text-text-primary mb-5">
                            Make documentation your <br className="hidden sm:block" />
                            <span className="gradient-text">winning advantage</span>
                        </h2>
                        <p className="text-text-muted text-lg mb-10 max-w-xl mx-auto">
                            Join thousands of developers who are shipping better, faster documentation with DevDocs AI.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link href="/login">
                                <Button variant="primary" size="lg">
                                    Get Started for Free
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                        <polyline points="12 5 19 12 12 19" />
                                    </svg>
                                </Button>
                            </Link>
                            <a href="#features">
                                <Button variant="secondary" size="lg">Explore Features</Button>
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ FOOTER ═══════ */}
            <footer className="bg-bg-primary border-t border-surface-border pt-16 pb-8 relative z-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded bg-action-primary flex items-center justify-center text-white">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                                </div>
                                <span className="font-bold text-xl tracking-tight text-text-primary">DevDocs AI</span>
                            </div>
                            <div className="flex gap-4 mb-6">
                                <a className="text-text-faded hover:text-text-primary transition-colors" href="#">GitHub</a>
                                <a className="text-text-faded hover:text-text-primary transition-colors" href="#">Twitter</a>
                                <a className="text-text-faded hover:text-text-primary transition-colors" href="#">LinkedIn</a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xs text-text-faded uppercase tracking-wider mb-4">Explore</h4>
                            <ul className="space-y-3 text-sm text-text-muted">
                                <li><a className="hover:text-action-primary transition-colors" href="#">Startups</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Enterprise</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Pricing</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xs text-text-faded uppercase tracking-wider mb-4">Resources</h4>
                            <ul className="space-y-3 text-sm text-text-muted">
                                <li><a className="hover:text-action-primary transition-colors" href="#">Blog</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Guides</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">API Reference</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xs text-text-faded uppercase tracking-wider mb-4">Documentation</h4>
                            <ul className="space-y-3 text-sm text-text-muted">
                                <li><a className="hover:text-action-primary transition-colors" href="#">Getting Started</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Components</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold text-xs text-text-faded uppercase tracking-wider mb-4">Legal</h4>
                            <ul className="space-y-3 text-sm text-text-muted">
                                <li><a className="hover:text-action-primary transition-colors" href="#">Privacy</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Terms</a></li>
                                <li><a className="hover:text-action-primary transition-colors" href="#">Security</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-surface-border gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded bg-action-success/10 text-action-success text-xs font-medium">
                            <div className="w-2 h-2 rounded-full bg-action-success animate-pulse"></div>
                            All systems normal
                        </div>
                        <div className="text-xs text-text-faded">
                            © {new Date().getFullYear()} DevDocs AI, Inc.
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ──────────────── Feature Card Component ──────────────── */
function FeatureCard({ feat, index }: { feat: typeof features[number]; index: number }) {
    const { setRef, inView } = useInView(0.15);
    return (
        <div
            ref={setRef}
            className={`group relative rounded-2xl border border-surface-border bg-bg-secondary p-7 transition-all duration-500 hover:border-action-primary/30 hover:shadow-[0_0_30px_var(--color-glow)] hover:-translate-y-1 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            style={{ transitionDelay: `${index * 80}ms` }}
        >
            <div className="w-12 h-12 rounded-xl bg-action-primary/10 flex items-center justify-center text-action-primary mb-5 group-hover:bg-action-primary/20 group-hover:scale-110 transition-all duration-300">
                {feat.icon}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">{feat.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{feat.description}</p>
        </div>
    );
}

/* ──────────────── Step Card Component ──────────────── */
function StepCard({ step, index }: { step: typeof steps[number]; index: number }) {
    const { setRef, inView } = useInView(0.15);
    return (
        <div
            ref={setRef}
            className={`relative text-center md:text-left p-6 rounded-2xl border border-surface-border bg-bg-secondary transition-all duration-500 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
            style={{ transitionDelay: `${index * 120}ms` }}
        >
            <span className="text-5xl font-black gradient-text opacity-30">{step.num}</span>
            <h3 className="text-lg font-semibold text-text-primary mt-2 mb-2">{step.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
            {/* Connector line (hidden on last) */}
            {index < 3 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-action-primary/50 to-transparent" />
            )}
        </div>
    );
}

/* ──────────────── Bento Card Component ──────────────── */
function BentoCard({
    title,
    desc,
    children,
    className = "",
    accent = false,
}: {
    title: string;
    desc: string;
    children?: React.ReactNode;
    className?: string;
    accent?: boolean;
}) {
    const { setRef, inView } = useInView(0.1);
    return (
        <div
            ref={setRef}
            className={`group rounded-2xl border border-surface-border bg-bg-secondary p-7 transition-all duration-500 hover:border-action-primary/30 hover:shadow-[0_0_30px_var(--color-glow)] ${accent ? "bg-gradient-to-br from-bg-secondary to-action-primary/[0.04]" : ""
                } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
        >
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
            {children}
        </div>
    );
}
