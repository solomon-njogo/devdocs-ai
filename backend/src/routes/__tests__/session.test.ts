import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ensureSessionId, COOKIE_NAME } from '../session.js';

describe('session / ensureSessionId', () => {
    const next = vi.fn() as NextFunction;

    function createMockReq(cookies?: Record<string, string>): Partial<Request> {
        return { cookies: cookies ?? {} };
    }

    function createMockRes(): Partial<Response> & { cookies: Record<string, unknown> } {
        const res: Partial<Response> & { cookies: Record<string, unknown> } = { cookies: {} };
        res.cookie = vi.fn().mockImplementation((name: string, value: unknown) => {
            res.cookies[name] = value;
            return res;
        });
        return res;
    }

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('uses existing session cookie when present', () => {
        const req = createMockReq({ [COOKIE_NAME]: 'existing-session-id' });
        const res = createMockRes();
        ensureSessionId(req as Request, res as Response, next);

        expect((req as Record<string, unknown>).sessionId).toBe('existing-session-id');
        expect(res.cookie).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalled();
    });

    it('generates a new session id when cookie is missing', () => {
        const req = createMockReq();
        const res = createMockRes();
        ensureSessionId(req as Request, res as Response, next);

        expect((req as Record<string, unknown>).sessionId).toBeDefined();
        expect(typeof (req as Record<string, unknown>).sessionId).toBe('string');
        expect(res.cookie).toHaveBeenCalledWith(
            COOKIE_NAME,
            expect.any(String),
            expect.objectContaining({
                httpOnly: true,
                path: '/',
            })
        );
        expect(next).toHaveBeenCalled();
    });

    it('exports the correct cookie name', () => {
        expect(COOKIE_NAME).toBe('devdocs_github_session');
    });
});
