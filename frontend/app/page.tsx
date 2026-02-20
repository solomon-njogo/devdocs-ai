
"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
            { threshold }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [threshold]);
    return { ref, inView };
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
    const statsRef = useInView(0.3);
    const projects = useCountUp(1200, 2000, statsRef.inView);
    const docs = useCountUp(15000, 2500, statsRef.inView);
    const devs = useCountUp(3200, 2000, statsRef.inView);

    useEffect(() => setMounted(true), []);

    return (
        <div className="min-h-screen bg-bg-primary text-text-primary overflow-x-hidden">
            {/* ─── Ambient background effects ─── */}
            <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
                <div className="absolute -top-[40%] -left-[20%] w-[80vw] h-[80vw] rounded-full bg-action-primary/[0.04] blur-[120px]" />
                <div className="absolute -bottom-[30%] -right-[15%] w-[60vw] h-[60vw] rounded-full bg-action-primary/[0.03] blur-[100px]" />
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
                        className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        <span className="text-text-primary">The Intelligent</span>
                        <br />
                        <span className="gradient-text">Documentation Engine</span>
                    </h1>

                    {/* Sub-headline */}
                    <p
                        className={`max-w-2xl mx-auto text-lg md:text-xl text-text-muted leading-relaxed mb-10 transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        Transform your ideas and repositories into beautiful, comprehensive documentation.
                        Powered by AI, built for developers.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className={`flex flex-wrap items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                            }`}
                    >
                        <Link href="/login">
                            <Button variant="primary" size="lg">
                                Start Building for Free
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </Button>
                        </Link>
                        <a href="#how-it-works">
                            <Button variant="secondary" size="lg">
                                See How It Works
                            </Button>
                        </a>
                    </div>

                    {/* Hero visual — Mock terminal/code window */}
                    <div
                        className={`relative max-w-3xl mx-auto transition-all duration-1000 delay-500 ${mounted ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
                            }`}
                    >
                        {/* Glow behind card */}
                        <div className="absolute inset-0 -m-4 rounded-3xl bg-action-primary/[0.06] blur-2xl animate-glow-pulse" />
                        <div className="relative rounded-2xl border border-surface-border bg-bg-secondary overflow-hidden shadow-2xl">
                            {/* Window chrome */}
                            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-surface-border bg-bg-tertiary/50">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="text-xs text-text-faded font-mono">devdocs-ai — generate docs</span>
                                </div>
                            </div>
                            {/* Code preview */}
                            <div className="p-6 md:p-8 font-mono text-sm leading-relaxed text-left">
                                <div className="flex items-center gap-2 text-text-muted mb-4">
                                    <span className="text-action-primary">$</span>
                                    <span className="typing-animation">devdocs generate --repo my-startup/api</span>
                                </div>
                                <div className="space-y-2 text-text-secondary">
                                    <p><span className="text-action-primary">✓</span> Analyzing repository structure...</p>
                                    <p><span className="text-action-primary">✓</span> Detecting frameworks & patterns...</p>
                                    <p><span className="text-action-primary">✓</span> Generating Product Requirements Document...</p>
                                    <p><span className="text-action-primary">✓</span> Creating User Stories & Acceptance Criteria...</p>
                                    <p><span className="text-action-primary">✓</span> Building Technical Architecture Docs...</p>
                                    <p className="pt-2 text-action-primary font-semibold">
                                        ✨ 12 documents generated successfully!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════ TRUSTED BY / STATS ═══════ */}
            <section id="stats" ref={statsRef.ref} className="relative z-10 py-16 border-t border-b border-surface-border bg-bg-secondary/50">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <p className="text-center text-sm text-text-faded uppercase tracking-widest mb-10 font-medium">Trusted by developers worldwide</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
                        {[
                            { value: projects, suffix: "+", label: "Projects Created" },
                            { value: docs, suffix: "+", label: "Documents Generated" },
                            { value: devs, suffix: "+", label: "Active Developers" },
                        ].map((stat) => (
                            <div key={stat.label} className="group">
                                <p className="text-4xl md:text-5xl font-bold gradient-text tabular-nums">
                                    {stat.value.toLocaleString()}{stat.suffix}
                                </p>
                                <p className="text-sm text-text-muted mt-2">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ FEATURES ═══════ */}
            <section id="features" className="relative z-10 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-sm text-action-primary font-semibold uppercase tracking-widest mb-3">Features</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Everything you need for <span className="gradient-text">world-class docs</span>
                        </h2>
                        <p className="max-w-xl mx-auto text-text-muted">
                            A complete documentation platform that integrates AI into every part of your docs lifecycle.
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
            <section id="how-it-works" className="relative z-10 py-24 md:py-32 bg-bg-secondary/40">
                <div className="max-w-5xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-sm text-action-primary font-semibold uppercase tracking-widest mb-3">How It Works</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            From zero to docs in <span className="gradient-text">minutes</span>
                        </h2>
                        <p className="max-w-xl mx-auto text-text-muted">
                            A simple, four-step process to generate beautiful documentation for any project.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <StepCard key={step.num} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════ BENTO SHOWCASE ═══════ */}
            <section className="relative z-10 py-24 md:py-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <p className="text-sm text-action-primary font-semibold uppercase tracking-widest mb-3">Built for the Intelligence Age</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                            Documentation that&apos;s <span className="gradient-text">actually smart</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Large card */}
                        <BentoCard
                            className="lg:col-span-2 lg:row-span-2"
                            title="AI-Native Content Generation"
                            desc="Our AI engine doesn't just template docs — it understands your code's architecture, patterns, and intent to produce meaningful, accurate documentation."
                            accent
                        >
                            <div className="mt-6 rounded-xl border border-surface-border bg-bg-tertiary/50 p-4 font-mono text-sm space-y-1">
                                <p className="text-text-muted">{`// AI-generated from your codebase`}</p>
                                <p><span className="text-[#c678dd]">export</span> <span className="text-[#61afef]">function</span> <span className="text-[#e5c07b]">createUser</span>(data: UserInput) {`{`}</p>
                                <p className="pl-4"><span className="text-[#6a737d]">// Validates input, hashes password,</span></p>
                                <p className="pl-4"><span className="text-[#6a737d]">// and persists to database</span></p>
                                <p className="pl-4"><span className="text-[#c678dd]">return</span> db.users.<span className="text-[#61afef]">create</span>({`{ ...data }`});</p>
                                <p>{`}`}</p>
                            </div>
                        </BentoCard>

                        {/* Small cards */}
                        <BentoCard
                            title="Real-time Sync"
                            desc="Push code, docs update. DevDocs stays in sync with your repository automatically."
                        >
                            <div className="flex items-center gap-3 mt-4">
                                <div className="w-10 h-10 rounded-lg bg-action-primary/10 flex items-center justify-center">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-action-primary">
                                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                </div>
                                <div className="text-xs text-text-muted">
                                    <p className="text-text-primary font-medium">Auto-sync enabled</p>
                                    <p>Last synced 2m ago</p>
                                </div>
                            </div>
                        </BentoCard>

                        <BentoCard
                            title="Team Collaboration"
                            desc="Invite teammates, review docs together, and maintain a shared knowledge base."
                        >
                            <div className="flex -space-x-2 mt-4">
                                {["#10b981", "#6366f1", "#f59e0b", "#ef4444"].map((c, i) => (
                                    <div
                                        key={i}
                                        className="w-9 h-9 rounded-full border-2 border-bg-secondary flex items-center justify-center text-[11px] font-bold text-white"
                                        style={{ background: c }}
                                    >
                                        {["SN", "AK", "JD", "MR"][i]}
                                    </div>
                                ))}
                                <div className="w-9 h-9 rounded-full border-2 border-bg-secondary bg-surface-hover flex items-center justify-center text-[11px] font-medium text-text-muted">
                                    +8
                                </div>
                            </div>
                        </BentoCard>
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
            <footer className="relative z-10 border-t border-surface-border bg-bg-secondary/60 py-16">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-10 mb-12">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-text-faded mb-4">Product</p>
                            <ul className="space-y-2.5 text-sm text-text-muted">
                                <li><a href="#features" className="hover:text-text-primary transition-colors">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a></li>
                                <li><Link href="/dashboard" className="hover:text-text-primary transition-colors">Dashboard</Link></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-text-faded mb-4">Resources</p>
                            <ul className="space-y-2.5 text-sm text-text-muted">
                                <li><a href="#" className="hover:text-text-primary transition-colors">Documentation</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">API Reference</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-text-faded mb-4">Company</p>
                            <ul className="space-y-2.5 text-sm text-text-muted">
                                <li><a href="#" className="hover:text-text-primary transition-colors">About</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-text-faded mb-4">Legal</p>
                            <ul className="space-y-2.5 text-sm text-text-muted">
                                <li><a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-text-primary transition-colors">Security</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-action-primary to-action-primary-hover flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                    <polyline points="14 2 14 8 20 8" />
                                </svg>
                            </div>
                            <span className="text-sm font-semibold gradient-text">DevDocs AI</span>
                        </div>
                        <p className="text-xs text-text-faded">&copy; {new Date().getFullYear()} DevDocs AI. All rights reserved.</p>
                        {/* Social icons */}
                        <div className="flex items-center gap-4">
                            <a href="#" className="text-text-faded hover:text-text-primary transition-colors" aria-label="GitHub">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                            <a href="#" className="text-text-faded hover:text-text-primary transition-colors" aria-label="Twitter">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ──────────────── Feature Card Component ──────────────── */
function FeatureCard({ feat, index }: { feat: typeof features[number]; index: number }) {
    const { ref, inView } = useInView(0.15);
    return (
        <div
            ref={ref}
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
    const { ref, inView } = useInView(0.15);
    return (
        <div
            ref={ref}
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
    const { ref, inView } = useInView(0.1);
    return (
        <div
            ref={ref}
            className={`group rounded-2xl border border-surface-border bg-bg-secondary p-7 transition-all duration-500 hover:border-action-primary/30 hover:shadow-[0_0_30px_var(--color-glow)] ${accent ? "bg-gradient-to-br from-bg-secondary to-action-primary/[0.04]" : ""
                } ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
        >
            <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
            <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
            {children}
        </div>
    );
}
