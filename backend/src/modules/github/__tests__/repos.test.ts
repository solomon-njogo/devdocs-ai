import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('github/repos', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns repo name and description on success', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                name: 'my-repo',
                description: 'A test repository',
            }),
        }));

        const { getRepoMetadata } = await import('../repos.js');
        const result = await getRepoMetadata('owner/my-repo', 'test-token');
        expect(result.name).toBe('my-repo');
        expect(result.description).toBe('A test repository');
    });

    it('falls back to repoId for name when name is missing', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({ description: null }),
        }));

        const { getRepoMetadata } = await import('../repos.js');
        const result = await getRepoMetadata('owner/my-repo', 'test-token');
        expect(result.name).toBe('owner/my-repo');
        expect(result.description).toBeNull();
    });

    it('throws on API error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            text: vi.fn().mockResolvedValue('Not found'),
        }));

        const { getRepoMetadata } = await import('../repos.js');
        await expect(getRepoMetadata('owner/missing', 'token')).rejects.toThrow('GitHub getRepoMetadata failed');
    });
});
