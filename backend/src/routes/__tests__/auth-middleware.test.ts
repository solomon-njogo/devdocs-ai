import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../../auth/index.js', () => ({
    getUserIdFromToken: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import { requireAuth } from '../auth-middleware.js';
import { getUserIdFromToken } from '../../auth/index.js';

function createMockReq(authHeader?: string): Partial<Request> {
    return {
        headers: authHeader ? { authorization: authHeader } : {},
    };
}

function createMockRes(): Partial<Response> & { statusCode?: number; body?: unknown } {
    const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
    res.status = vi.fn().mockImplementation((code: number) => {
        res.statusCode = code;
        return res;
    });
    res.json = vi.fn().mockImplementation((body: unknown) => {
        res.body = body;
        return res;
    });
    return res;
}

describe('auth-middleware / requireAuth', () => {
    const next = vi.fn() as NextFunction;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 401 when no Authorization header is present', () => {
        const req = createMockReq();
        const res = createMockRes();
        requireAuth(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.body).toEqual(expect.objectContaining({ code: 'UNAUTHORIZED' }));
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header does not start with Bearer', () => {
        const req = createMockReq('Basic abc123');
        const res = createMockRes();
        requireAuth(req as Request, res as Response, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it('calls next and sets userId when token is valid', async () => {
        vi.mocked(getUserIdFromToken).mockResolvedValue('user-123');
        const req = createMockReq('Bearer valid-token');
        const res = createMockRes();
        requireAuth(req as Request, res as Response, next);

        // Wait for the promise to resolve
        await vi.waitFor(() => {
            expect(next).toHaveBeenCalled();
        });
        expect((req as Record<string, unknown>).userId).toBe('user-123');
    });

    it('returns 401 when getUserIdFromToken returns null', async () => {
        vi.mocked(getUserIdFromToken).mockResolvedValue(null);
        const req = createMockReq('Bearer invalid-token');
        const res = createMockRes();
        requireAuth(req as Request, res as Response, next);

        await vi.waitFor(() => {
            expect(res.status).toHaveBeenCalledWith(401);
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 when getUserIdFromToken throws', async () => {
        vi.mocked(getUserIdFromToken).mockRejectedValue(new Error('auth failure'));
        const req = createMockReq('Bearer broken-token');
        const res = createMockRes();
        requireAuth(req as Request, res as Response, next);

        await vi.waitFor(() => {
            expect(res.status).toHaveBeenCalledWith(401);
        });
        expect(next).not.toHaveBeenCalled();
    });
});
