import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response } from 'express';

vi.mock('../../db/index.js', () => ({
    getProjectsByUserId: vi.fn(),
    getProjectById: vi.fn(),
    getDocsByProjectId: vi.fn(),
    getDocById: vi.fn(),
    insertProjectDoc: vi.fn(),
    updateProjectDoc: vi.fn(),
    deleteProjectDoc: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

import {
    getProjectsByUserId,
    getProjectById,
    getDocsByProjectId,
    getDocById,
    insertProjectDoc,
    updateProjectDoc,
    deleteProjectDoc,
} from '../../db/index.js';

function createMockReq(overrides: Record<string, unknown> = {}): Partial<Request> {
    return {
        params: {},
        body: {},
        userId: 'user-123',
        ...overrides,
    } as Partial<Request>;
}

function createMockRes(): Partial<Response> & { statusCode?: number; body?: unknown; sent?: boolean } {
    const res: Partial<Response> & { statusCode?: number; body?: unknown; sent?: boolean } = {};
    res.status = vi.fn().mockImplementation((code: number) => { res.statusCode = code; return res; });
    res.json = vi.fn().mockImplementation((body: unknown) => { res.body = body; return res; });
    res.send = vi.fn().mockImplementation(() => { res.sent = true; return res; });
    return res;
}

describe('routes/projects', () => {
    let projectRoutes: import('../projects.js')['projectRoutes'];

    beforeEach(async () => {
        vi.clearAllMocks();
        const mod = await import('../projects.js');
        projectRoutes = mod.projectRoutes;
    });

    describe('GET /projects', () => {
        it('returns projects for the user', async () => {
            const mockProjects = [{ id: 'p1', name: 'Project 1' }];
            vi.mocked(getProjectsByUserId).mockResolvedValue(mockProjects as never);

            const handler = projectRoutes.stack.find(
                (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                    r.route?.path === '/projects' && r.route?.methods?.get
            )?.route?.stack[0]?.handle;

            if (handler) {
                const req = createMockReq();
                const res = createMockRes();
                await handler(req, res);
                expect(res.json).toHaveBeenCalledWith(mockProjects);
            }
        });

        it('returns 401 when userId is missing', async () => {
            const handler = projectRoutes.stack.find(
                (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                    r.route?.path === '/projects' && r.route?.methods?.get
            )?.route?.stack[0]?.handle;

            if (handler) {
                const req = createMockReq({ userId: undefined });
                const res = createMockRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(401);
            }
        });
    });

    describe('GET /projects/:id', () => {
        it('returns project with docs', async () => {
            const mockProject = { id: 'p1', name: 'Test' };
            const mockDocs = [{ id: 'd1', type: 'prd' }];
            vi.mocked(getProjectById).mockResolvedValue(mockProject as never);
            vi.mocked(getDocsByProjectId).mockResolvedValue(mockDocs as never);

            const handler = projectRoutes.stack.find(
                (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                    r.route?.path === '/projects/:id' && r.route?.methods?.get
            )?.route?.stack[0]?.handle;

            if (handler) {
                const req = createMockReq({ params: { id: 'p1' } });
                const res = createMockRes();
                await handler(req, res);
                expect(res.json).toHaveBeenCalledWith({ project: mockProject, docs: mockDocs });
            }
        });

        it('returns 404 when project not found', async () => {
            vi.mocked(getProjectById).mockResolvedValue(null as never);

            const handler = projectRoutes.stack.find(
                (r: { route?: { path: string; methods: Record<string, boolean> } }) =>
                    r.route?.path === '/projects/:id' && r.route?.methods?.get
            )?.route?.stack[0]?.handle;

            if (handler) {
                const req = createMockReq({ params: { id: 'missing' } });
                const res = createMockRes();
                await handler(req, res);
                expect(res.status).toHaveBeenCalledWith(404);
            }
        });
    });
});
