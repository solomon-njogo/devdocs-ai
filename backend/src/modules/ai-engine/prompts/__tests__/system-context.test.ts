import { describe, it, expect } from 'vitest';
import { buildSystemContext } from '../system-context.js';

describe('buildSystemContext', () => {
    it('returns a system prompt for a new idea (no context)', () => {
        const result = buildSystemContext();
        expect(result).toContain('CO-STAR Framework');
        expect(result).toContain('"Project"');
        expect(result).toContain('new product idea');
    });

    it('uses projectName from context', () => {
        const result = buildSystemContext({ projectName: 'My App' });
        expect(result).toContain('"My App"');
    });

    it('handles repo source with codebase summary', () => {
        const result = buildSystemContext({
            source: 'repo',
            projectName: 'RepoApp',
            codebaseSummary: 'This is a Node.js app',
        });
        expect(result).toContain('existing codebase');
        expect(result).toContain('RepoApp');
        expect(result).toContain('This is a Node.js app');
    });

    it('handles repo source without codebase summary', () => {
        const result = buildSystemContext({ source: 'repo', projectName: 'RepoApp' });
        expect(result).toContain('new product idea');
        expect(result).toContain('RepoApp');
    });

    it('includes techStack when provided', () => {
        const result = buildSystemContext({ techStack: 'React + Express' });
        expect(result).toContain('React + Express');
    });

    it('uses default techStack when not provided', () => {
        const result = buildSystemContext();
        expect(result).toContain('Not specified');
    });
});
