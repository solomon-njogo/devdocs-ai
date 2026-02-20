import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock('../../ai-engine/index.js', () => ({
    generatePRD: vi.fn().mockResolvedValue('# PRD Content'),
    generateUserStories: vi.fn().mockResolvedValue('# User Stories'),
    generateUserJourneys: vi.fn().mockResolvedValue('# User Journeys'),
}));

vi.mock('../../github/index.js', () => ({
    createOrUpdateFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockResolvedValue('# README'),
}));

describe('doc-generator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateDocsFromIdea', () => {
        it('generates PRD, user stories, and user journeys', async () => {
            const { generateDocsFromIdea } = await import('../index.js');
            const result = await generateDocsFromIdea({
                projectName: 'Test App',
                description: 'A test application',
            });

            expect(result.projectName).toBe('Test App');
            expect(result.docs).toHaveLength(3);
            expect(result.docs[0].type).toBe('prd');
            expect(result.docs[0].content).toBe('# PRD Content');
            expect(result.docs[1].type).toBe('user-story');
            expect(result.docs[2].type).toBe('user-journey');
        });

        it('includes optional fields in the input', async () => {
            const { generateDocsFromIdea } = await import('../index.js');
            const result = await generateDocsFromIdea({
                projectName: 'Test',
                description: 'Description',
                features: 'Feature 1',
                requirements: 'Must be fast',
            });
            expect(result.docs).toHaveLength(3);
        });
    });

    describe('reviewAndPushDocs', () => {
        it('generates and pushes docs to GitHub', async () => {
            const { reviewAndPushDocs } = await import('../index.js');
            const { createOrUpdateFile } = await import('../../github/index.js');

            const result = await reviewAndPushDocs('owner/repo', 'test-token');
            expect(result.repoId).toBe('owner/repo');
            expect(result.paths).toHaveLength(3);
            expect(result.docs).toHaveLength(3);
            expect(createOrUpdateFile).toHaveBeenCalledTimes(3);
        });
    });

    describe('generateAndPushPRD', () => {
        it('generates and pushes a single PRD', async () => {
            const { generateAndPushPRD } = await import('../index.js');
            const result = await generateAndPushPRD('owner/repo', 'input text', 'test-token');
            expect(result.path).toBe('docs/prd.md');
            expect(result.content).toBe('# PRD Content');
        });

        it('uses a custom path when provided', async () => {
            const { generateAndPushPRD } = await import('./index.js');
            const result = await generateAndPushPRD('owner/repo', 'input', 'token', 'custom/path.md');
            expect(result.path).toBe('custom/path.md');
        });
    });
});
