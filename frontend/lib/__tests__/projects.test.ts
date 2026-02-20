import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../api', () => ({
    api: vi.fn(),
}));

import { api } from '../api';

describe('lib/projects', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getProjects', () => {
        it('fetches projects list', async () => {
            const mockProjects = [{ id: 'p1', name: 'Project 1' }];
            vi.mocked(api).mockResolvedValue(mockProjects);

            const { getProjects } = await import('../projects');
            const result = await getProjects();
            expect(api).toHaveBeenCalledWith('/api/projects');
            expect(result).toEqual(mockProjects);
        });
    });

    describe('getProject', () => {
        it('fetches a single project by id', async () => {
            const mockProject = { project: { id: 'p1' }, docs: [] };
            vi.mocked(api).mockResolvedValue(mockProject);

            const { getProject } = await import('../projects');
            const result = await getProject('p1');
            expect(api).toHaveBeenCalledWith('/api/projects/p1');
            expect(result).toEqual(mockProject);
        });
    });

    describe('createDoc', () => {
        it('creates a new document', async () => {
            const newDoc = { id: 'd1', type: 'prd' };
            vi.mocked(api).mockResolvedValue(newDoc);

            const { createDoc } = await import('../projects');
            const result = await createDoc('p1', { type: 'prd', path: 'docs/prd.md', content: '# PRD' });
            expect(api).toHaveBeenCalledWith(
                '/api/projects/p1/docs',
                expect.objectContaining({ method: 'POST' })
            );
            expect(result).toEqual(newDoc);
        });
    });

    describe('updateDoc', () => {
        it('updates an existing document', async () => {
            const updated = { id: 'd1', content: 'updated' };
            vi.mocked(api).mockResolvedValue(updated);

            const { updateDoc } = await import('../projects');
            const result = await updateDoc('p1', 'd1', { content: 'updated' });
            expect(api).toHaveBeenCalledWith(
                '/api/projects/p1/docs/d1',
                expect.objectContaining({ method: 'PATCH' })
            );
            expect(result).toEqual(updated);
        });
    });

    describe('deleteDoc', () => {
        it('deletes a document', async () => {
            vi.mocked(api).mockResolvedValue(undefined);

            const { deleteDoc } = await import('../projects');
            await deleteDoc('p1', 'd1');
            expect(api).toHaveBeenCalledWith(
                '/api/projects/p1/docs/d1',
                expect.objectContaining({ method: 'DELETE' })
            );
        });
    });
});
