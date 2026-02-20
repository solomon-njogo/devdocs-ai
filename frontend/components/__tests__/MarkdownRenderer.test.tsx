import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the heavy dependencies
vi.mock('react-markdown', () => ({
    default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));
vi.mock('remark-gfm', () => ({ default: () => { } }));
vi.mock('rehype-highlight', () => ({ default: () => { } }));

import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
    it('renders markdown content', () => {
        render(<MarkdownRenderer content="# Hello World" />);
        expect(screen.getByTestId('markdown')).toHaveTextContent('# Hello World');
    });

    it('renders (empty) when content is empty string', () => {
        render(<MarkdownRenderer content="" />);
        expect(screen.getByText('(empty)')).toBeInTheDocument();
    });

    it('applies custom className', () => {
        const { container } = render(<MarkdownRenderer content="test" className="custom-class" />);
        expect(container.firstChild).toHaveClass('custom-class');
    });

    it('renders with markdown-body base class', () => {
        const { container } = render(<MarkdownRenderer content="test" />);
        expect(container.firstChild).toHaveClass('markdown-body');
    });
});
