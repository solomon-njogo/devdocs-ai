import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../modules/doc-generator/index.js', () => ({
    generateDocsFromIdea: vi.fn().mockResolvedValue({
        projectName: 'Test App',
        docs: [
            { type: 'prd', path: '/docs/prd.md', content: '# PRD' },
            { type: 'user-story', path: '/docs/user-stories.md', content: '# Stories' },
            { type: 'user-journey', path: '/docs/user-journeys.md', content: '# Journeys' },
        ],
    }),
    reviewAndPushDocs: vi.fn().mockResolvedValue({
        repoId: 'owner/repo',
        paths: ['docs/prd.md'],
        summary: 'Done',
        docs: [{ type: 'prd', path: 'docs/prd.md', content: '# PRD' }],
    }),
}));

vi.mock('../../modules/github/index.js', () => ({
    getRepoMetadata: vi.fn().mockResolvedValue({ name: 'repo', description: 'Test repo' }),
}));

vi.mock('../auth.js', () => ({
    getTokenFromRequest: vi.fn().mockReturnValue('github-token'),
}));

vi.mock('../../db/index.js', () => ({
    createProject: vi.fn().mockResolvedValue({ id: 'proj-1', name: 'Test' }),
    setRepoToken: vi.fn().mockResolvedValue(undefined),
    insertProjectDocs: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('routes/onboarding', () => {
    let onboardingRoutes: import('../onboarding.js')['onboardingRoutes'];

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../onboarding.js');
        onboardingRoutes = mod.onboardingRoutes;
    });

    function getHandler(path: string, method: string) {
        return onboardingRoutes.stack.find(
            (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                r.route?.path === path && r.route?.methods?.[method]
        )?.route?.stack[0]?.handle;
    }

    describe('POST /onboarding/idea', () => {
        it('returns 401 when userId is missing', async () => {
            const handler = getHandler('/onboarding/idea', 'post');
            if (handler) {
                const req = { body: {}, headers: {} } as Request;
                const res = createRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(401);
            }
        });

        it('returns 400 when projectName or description is missing', async () => {
            const handler = getHandler('/onboarding/idea', 'post');
            if (handler) {
                const req = { body: { projectName: '', description: '' }, userId: 'user-1' } as unknown as Request;
                const res = createRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(400);
            }
        });
    });

    describe('POST /onboarding/review-repo', () => {
        it('returns 401 when userId is missing', async () => {
            const handler = getHandler('/onboarding/review-repo', 'post');
            if (handler) {
                const req = { body: {}, headers: {} } as Request;
                const res = createRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(401);
            }
        });

        it('returns 400 when repoId is missing', async () => {
            const handler = getHandler('/onboarding/review-repo', 'post');
            if (handler) {
                const req = {
                    body: { repoId: '' },
                    userId: 'user-1',
                    headers: { authorization: 'Bearer token' },
                } as unknown as Request;
                const res = createRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(400);
            }
        });
    });
});

function createRes(): Partial<Response> & { statusCode?: number; body?: unknown } {
    const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
    res.status = vi.fn().mockImplementation((code: number) => { res.statusCode = code; return res; });
    res.json = vi.fn().mockImplementation((body: unknown) => { res.body = body; return res; });
    return res;
}
