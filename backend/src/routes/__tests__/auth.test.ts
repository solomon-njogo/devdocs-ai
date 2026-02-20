import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../modules/github/index.js', () => ({
    getAuthorizationUrl: vi.fn().mockReturnValue('https://github.com/login/oauth/authorize?test=1'),
    exchangeCodeForToken: vi.fn().mockResolvedValue('ghp_test_token'),
}));

vi.mock('../../token-store.js', () => ({
    getToken: vi.fn().mockReturnValue('stored-token'),
    setToken: vi.fn(),
}));

vi.mock('../auth-middleware.js', () => ({
    requireAuth: vi.fn((_req: Request, _res: Response, next: () => void) => {
        (_req as Record<string, unknown>).userId = 'user-123';
        next();
    }),
}));

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('routes/auth', () => {
    beforeEach(() => {
        vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-secret');
        vi.clearAllMocks();
    });

    it('getTokenFromRequest returns token for authenticated user', async () => {
        const { getTokenFromRequest } = await import('../auth.js');
        const req = { userId: 'user-123' } as unknown as Request;
        const result = getTokenFromRequest(req);
        expect(result).toBe('stored-token');
    });

    it('getTokenFromRequest returns null when userId is missing', async () => {
        const { getTokenFromRequest } = await import('../auth.js');
        const req = {} as Request;
        const result = getTokenFromRequest(req);
        expect(result).toBeNull();
    });
});
