"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";

/* ── Custom component overrides for styling ── */
const components: Components = {
    h1: ({ children, ...props }) => (
        <h1
            className="text-2xl font-bold text-text-primary mt-6 mb-3 pb-2 border-b border-surface-border first:mt-0"
            {...props}
        >
            {children}
        </h1>
    ),
    h2: ({ children, ...props }) => (
        <h2
            className="text-xl font-semibold text-text-primary mt-6 mb-2 pb-1.5 border-b border-surface-border/50"
            {...props}
        >
            {children}
        </h2>
    ),
    h3: ({ children, ...props }) => (
        <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2" {...props}>
            {children}
        </h3>
    ),
    h4: ({ children, ...props }) => (
        <h4 className="text-base font-semibold text-text-primary mt-4 mb-1.5" {...props}>
            {children}
        </h4>
    ),
    h5: ({ children, ...props }) => (
        <h5 className="text-sm font-semibold text-text-secondary mt-3 mb-1" {...props}>
            {children}
        </h5>
    ),
    h6: ({ children, ...props }) => (
        <h6 className="text-sm font-medium text-text-muted mt-3 mb-1" {...props}>
            {children}
        </h6>
    ),
    p: ({ children, ...props }) => (
        <p className="text-text-secondary leading-relaxed mb-3 last:mb-0" {...props}>
            {children}
        </p>
    ),
    a: ({ children, href, ...props }) => (
        <a
            href={href}
            className="text-action-primary hover:text-action-primary-hover underline underline-offset-2 transition-colors"
            target="_blank"
            rel="noopener noreferrer"
            {...props}
        >
            {children}
        </a>
    ),
    ul: ({ children, ...props }) => (
        <ul className="list-disc list-inside space-y-1 mb-3 text-text-secondary pl-2" {...props}>
            {children}
        </ul>
    ),
    ol: ({ children, ...props }) => (
        <ol className="list-decimal list-inside space-y-1 mb-3 text-text-secondary pl-2" {...props}>
            {children}
        </ol>
    ),
    li: ({ children, ...props }) => (
        <li className="leading-relaxed" {...props}>
            {children}
        </li>
    ),
    blockquote: ({ children, ...props }) => (
        <blockquote
            className="border-l-4 border-action-primary/40 bg-surface-hover/50 rounded-r-lg pl-4 pr-3 py-2 my-3 text-text-secondary italic"
            {...props}
        >
            {children}
        </blockquote>
    ),
    code: ({ children, className, ...props }) => {
        const isInline = !className;
        if (isInline) {
            return (
                <code
                    className="bg-surface-hover text-action-primary font-mono text-[0.875em] px-1.5 py-0.5 rounded-md border border-surface-border/50"
                    {...props}
                >
                    {children}
                </code>
            );
        }
        return (
            <code className={`${className ?? ""} font-mono text-sm`} {...props}>
                {children}
            </code>
        );
    },
    pre: ({ children, ...props }) => (
        <pre
            className="bg-bg-tertiary border border-surface-border rounded-lg p-4 my-3 overflow-x-auto text-sm leading-relaxed"
            {...props}
        >
            {children}
        </pre>
    ),
    table: ({ children, ...props }) => (
        <div className="overflow-x-auto my-3 rounded-lg border border-surface-border">
            <table className="w-full text-sm" {...props}>
                {children}
            </table>
        </div>
    ),
    thead: ({ children, ...props }) => (
        <thead className="bg-surface-hover/70 border-b border-surface-border" {...props}>
            {children}
        </thead>
    ),
    tbody: ({ children, ...props }) => (
        <tbody className="divide-y divide-surface-border" {...props}>
            {children}
        </tbody>
    ),
    tr: ({ children, ...props }) => (
        <tr className="hover:bg-surface-hover/30 transition-colors" {...props}>
            {children}
        </tr>
    ),
    th: ({ children, ...props }) => (
        <th
            className="text-left px-4 py-2.5 font-semibold text-text-primary text-xs uppercase tracking-wider"
            {...props}
        >
            {children}
        </th>
    ),
    td: ({ children, ...props }) => (
        <td className="px-4 py-2.5 text-text-secondary" {...props}>
            {children}
        </td>
    ),
    hr: (props) => (
        <hr
            className="my-6 border-none h-px bg-gradient-to-r from-transparent via-surface-border to-transparent"
            {...props}
        />
    ),
    img: ({ alt, ...props }) => (
        <img
            className="max-w-full rounded-lg border border-surface-border my-3 shadow-sm"
            alt={alt ?? ""}
            loading="lazy"
            {...props}
        />
    ),
    input: ({ type, checked, ...props }) => {
        if (type === "checkbox") {
            return (
                <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="mr-2 accent-action-primary rounded"
                    {...props}
                />
            );
        }
        return <input type={type} {...props} />;
    },
    strong: ({ children, ...props }) => (
        <strong className="font-semibold text-text-primary" {...props}>
            {children}
        </strong>
    ),
    em: ({ children, ...props }) => (
        <em className="italic text-text-secondary" {...props}>
            {children}
        </em>
    ),
};

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
    if (!content) {
        return (
            <p className="text-text-faded italic text-sm">(empty)</p>
        );
    }

    return (
        <div className={`markdown-body ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
