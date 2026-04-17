
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";

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
        description: "Transform ideas and repos into comprehensive PRDs, user stories and technical documentation in seconds.",
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
        description: "Tailor every detail from doc structure to templates to match your team's workflow and needs.",
    },
];

/* ──────────────── How-it-works steps (also mirrored in JSON-LD HowTo below) ──────────────── */
const steps = [
    {
        num: "01",
        title: "Point us at GitHub or a written brief",
        desc: "Connect a repo you already push to; we read what is on disk today. No code yet? Describe the product in your own words and we still have a starting point.",
    },
    {
        num: "02",
        title: "See how the pieces fit together",
        desc: "We look at folders, entry files and naming so the write-up matches how your app or service is really laid out, closer to onboarding a new teammate than guessing from a blank page.",
    },
    {
        num: "03",
        title: "Get doc pages you can share tomorrow",
        desc: "Guides, how-tos and reference-style sections land in one readable layout, fine to drop in a PR comment, Slack thread or internal wiki, then polish before anything goes public.",
    },
    {
        num: "04",
        title: "Edit when you merge, not when you panic",
        desc: "After you ship a change, skim what moved and adjust a paragraph or two. Small follow-ups beat rewriting everything whenever your API or UI shifts.",
    },
];

const howItWorksHowToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How DevDocs AI creates documentation",
    description:
        "Connect a GitHub repository or a short written brief and turn it into structured developer documentation, clear for humans and helpful alongside AI coding assistants.",
    step: steps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.title,
        text: step.desc,
    })),
};

/* ════════════════ LANDING PAGE ════════════════ */
export default function LandingPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [heroEmail, setHeroEmail] = useState("");

    useEffect(() => {
        Promise.resolve().then(() => setMounted(true));
    }, []);

    const goToSignUpWithEmail = (e: FormEvent) => {
        e.preventDefault();
        const trimmed = heroEmail.trim();
        if (!trimmed) return;
        router.push(`/login?mode=signup&email=${encodeURIComponent(trimmed)}`);
    };

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-action-primary selection:text-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksHowToJsonLd) }}
            />
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
                    </div>

                    {/* CTA */}
                    <div className="flex items-center gap-3">
                        <Link href="/login">
                            <Button variant="ghost" size="sm">Log in</Button>
                        </Link>
                        <Link href="/login?mode=signup">
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
                        <form onSubmit={goToSignUpWithEmail} className="relative w-full">
                            <input
                                className="w-full pl-5 pr-32 py-4 rounded-full border border-surface-border bg-bg-secondary text-text-primary focus:ring-2 focus:ring-action-primary focus:border-transparent shadow-sm outline-none"
                                placeholder="Enter your work email"
                                type="email"
                                name="workEmail"
                                autoComplete="email"
                                required
                                value={heroEmail}
                                onChange={(e) => setHeroEmail(e.target.value)}
                                aria-label="Work email"
                            />
                            <button
                                type="submit"
                                className="absolute right-1.5 top-1.5 bottom-1.5 bg-action-primary hover:bg-action-primary-hover text-white px-6 rounded-full text-sm font-medium transition-colors"
                            >
                                Start now
                            </button>
                        </form>
                    </div>

                    {/* Hero visual: mock terminal/code window */}
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

            {/* ═══════ FEATURES ═══════ */}
            <section id="features" className="relative z-10 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-base text-action-primary font-semibold tracking-wide uppercase">End-to-End Workflow</h2>
                        <p className="mt-2 text-3xl leading-[1.2] font-bold tracking-tight text-text-primary sm:text-4xl">
                            Built for the Intelligence Age
                        </p>
                        <p className="mt-4 max-w-2xl text-xl text-text-muted mx-auto">
                            Integrate AI into every part of your docs lifecycle. Woven into how your knowledge is written, maintained and understood.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feat, i) => (
                            <FeatureCard key={feat.title} feat={feat} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ HOW IT WORKS ═══════ */}
            <section
                id="how-it-works"
                className="relative z-10 scroll-mt-24 border-t border-surface-border/60 py-24 md:py-32"
                aria-labelledby="how-it-works-heading"
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="mx-auto mb-14 max-w-3xl text-center">
                        <p className="text-base font-semibold uppercase tracking-wide text-action-primary">How it works</p>
                        <h2 id="how-it-works-heading" className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
                            From your repo or a short spec to docs developers will actually open
                        </h2>
                        <p className="mt-4 text-lg leading-relaxed text-text-muted sm:text-xl">
                            Built for developers at every level: whether you are new to the codebase or you have shipped here for years, you should not need a second
                            career as a tech writer. Link a GitHub repo or paste what you are building, and get structured technical docs (guides next to your README,
                            reference material and the boring-but-important stuff) that read well for your team and play nicely with AI assistants in your editor.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
                        {steps.map((step, i) => (
                            <StepCard key={step.num} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ WORKFLOW SECTIONS ═══════ */}
            <section className="py-24 bg-bg-primary relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                    <div className="max-w-4xl mx-auto mb-8">
                        {/* Built for people and AI */}
                        <div className="bg-bg-secondary rounded-3xl p-8 border border-surface-border shadow-sm hover:shadow-md transition-shadow">
                            <div className="mb-6 inline-flex items-center justify-center p-3 bg-action-primary/10 rounded-xl text-action-primary">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-text-primary mb-4">Built for both people and AI</h3>
                            <p className="text-text-muted mb-8 text-lg">
                                Ensure your product shows up in the AI workflows users already rely on.
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
                            <Link href="/login?mode=signup">
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
            <footer className="relative z-10 mt-8 border-t border-surface-border bg-gradient-to-b from-bg-secondary/40 to-bg-primary">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-action-primary/35 to-transparent" aria-hidden />
                <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10 lg:gap-16">
                        <div className="max-w-md">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center text-white shadow-lg shadow-action-primary-glow">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <span className="font-bold text-2xl tracking-tight text-text-primary block leading-tight">DevDocs AI</span>
                                    <p className="mt-3 text-sm text-text-muted leading-relaxed">
                                        Ship documentation that stays accurate as your product evolves. Readable by your team and by the AI tools they use every day.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-6 lg:gap-8">
                            <p className="text-xs font-medium uppercase tracking-widest text-text-faded lg:hidden">Connect</p>
                            <div className="flex items-center gap-3">
                                <a
                                    href="https://github.com/solomon-njogo/devdocs-ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-bg-secondary/80 text-text-muted transition-all hover:border-action-primary/40 hover:bg-action-primary/5 hover:text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                                    aria-label="DevDocs AI on GitHub"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://www.linkedin.com/in/solomon-njogo/"
                                    target="_blank"
                                    rel="noopener noreferrer"   
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-surface-border bg-bg-secondary/80 text-text-muted transition-all hover:border-action-primary/40 hover:bg-action-primary/5 hover:text-action-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                                    aria-label="DevDocs Founder on LinkedIn"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 flex flex-col-reverse gap-6 border-t border-surface-border pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <p className="text-center text-xs text-text-faded sm:text-left">
                            © {new Date().getFullYear()} DevDocs AI Inc. All rights reserved.
                        </p>
                        <div className="flex justify-center sm:justify-end">
                            <div className="inline-flex items-center gap-2 rounded-full border border-action-success/20 bg-action-success/10 px-3.5 py-1.5 text-xs font-medium text-action-success">
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-action-success opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-action-success" />
                                </span>
                                All systems normal
                            </div>
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
            {index < steps.length - 1 && (
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
