import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';
import crypto from 'crypto';

vi.mock('../../modules/github/index.js', () => ({
    verifyWebhookSignature: vi.fn(),
}));

vi.mock('../../modules/doc-generator/index.js', () => ({
    reviewAndPushDocs: vi.fn().mockResolvedValue({
        repoId: 'owner/repo',
        paths: ['docs/prd.md'],
        summary: 'Done',
        docs: [],
    }),
}));

vi.mock('../../db/index.js', () => ({
    getRepoToken: vi.fn(),
    getProjectIdByRepoId: vi.fn().mockResolvedValue('proj-1'),
    upsertRepoMeta: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { verifyWebhookSignature } from '../../modules/github/index.js';
import { getRepoToken } from '../../db/index.js';

describe('routes/webhooks', () => {
    let webhookRoutes: import('../webhooks.js')['webhookRoutes'];

    beforeEach(async () => {
        vi.clearAllMocks();
        vi.stubEnv('WEBHOOK_SECRET', 'test-secret');
        vi.resetModules();
        const mod = await import('../webhooks.js');
        webhookRoutes = mod.webhookRoutes;
    });

    function getHandler() {
        return webhookRoutes.stack.find(
            (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                r.route?.path === '/webhooks/github' && r.route?.methods?.post
        )?.route?.stack[0]?.handle;
    }

    it('returns 401 for invalid signature', async () => {
        vi.mocked(verifyWebhookSignature).mockReturnValue(false);
        const handler = getHandler();
        if (handler) {
            const req = {
                body: '{}',
                headers: { 'x-hub-signature-256': 'sha256=invalid' },
            } as unknown as Request;
            const res = createRes();
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        }
    });

    it('returns 200 for non-branch push', async () => {
        vi.mocked(verifyWebhookSignature).mockReturnValue(true);
        const payload = {
            ref: 'refs/tags/v1.0',
            repository: { id: 1, full_name: 'owner/repo', default_branch: 'main' },
        };
        const handler = getHandler();
        if (handler) {
            const req = {
                body: payload,
                rawBody: Buffer.from(JSON.stringify(payload)),
                headers: { 'x-hub-signature-256': 'sha256=test' },
            } as unknown as Request;
            const res = createRes();
            await handler(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        }
    });

    it('skips sync when no token is stored for repo', async () => {
        vi.mocked(verifyWebhookSignature).mockReturnValue(true);
        vi.mocked(getRepoToken).mockResolvedValue(null);
        const payload = {
            ref: 'refs/heads/main',
            repository: { id: 1, full_name: 'owner/repo', default_branch: 'main' },
        };
        const handler = getHandler();
        if (handler) {
            const req = {
                body: payload,
                rawBody: Buffer.from(JSON.stringify(payload)),
                headers: { 'x-hub-signature-256': 'sha256=test' },
            } as unknown as Request;
            const res = createRes();
            await handler(req, res);
            expect(res.body).toEqual(expect.objectContaining({ message: expect.stringContaining("No token") }));
        }
    });
});

function createRes(): Partial<Response> & { statusCode?: number; body?: unknown } {
    const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
    res.status = vi.fn().mockImplementation((code: number) => { res.statusCode = code; return res; });
    res.json = vi.fn().mockImplementation((body: unknown) => { res.body = body; return res; });
    return res;
}
