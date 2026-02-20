import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('../providers/index.js', () => ({
    complete: vi.fn().mockResolvedValue('Generated markdown content'),
}));

describe('ai-engine/index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('generatePRD calls complete and returns content', async () => {
        const { generatePRD } = await import('../index.js');
        const result = await generatePRD('Build a todo app');
        expect(result).toBe('Generated markdown content');
    });

    it('generateUserStories calls complete and returns content', async () => {
        const { generateUserStories } = await import('../index.js');
        const result = await generateUserStories('Build a todo app');
        expect(result).toBe('Generated markdown content');
    });

    it('generateUserJourneys calls complete and returns content', async () => {
        const { generateUserJourneys } = await import('../index.js');
        const result = await generateUserJourneys('Build a todo app');
        expect(result).toBe('Generated markdown content');
    });

    it('generateApiDocs returns markdown with input', async () => {
        const { generateApiDocs } = await import('../index.js');
        const result = await generateApiDocs('API spec here');
        expect(result).toContain('API Documentation');
        expect(result).toContain('API spec here');
        expect(result).toContain('DevDocs AI');
    });

    it('generatePRD accepts optional context', async () => {
        const { generatePRD } = await import('../index.js');
        const result = await generatePRD('test', { source: 'repo', projectName: 'MyApp' });
        expect(result).toBe('Generated markdown content');
    });
});
