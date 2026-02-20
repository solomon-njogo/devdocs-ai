import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('github/files', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('readFile', () => {
        it('returns file content on success', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                text: vi.fn().mockResolvedValue('# README\nThis is a test'),
            }));

            const { readFile } = await import('../files.js');
            const content = await readFile('owner/repo', 'README.md', 'test-token');
            expect(content).toBe('# README\nThis is a test');
        });

        it('returns empty string for 404', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                text: vi.fn().mockResolvedValue('Not found'),
            }));

            const { readFile } = await import('../files.js');
            const content = await readFile('owner/repo', 'missing.md', 'test-token');
            expect(content).toBe('');
        });

        it('throws on non-404 error', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                text: vi.fn().mockResolvedValue('Server error'),
            }));

            const { readFile } = await import('../files.js');
            await expect(readFile('owner/repo', 'file.md', 'token')).rejects.toThrow('GitHub readFile failed');
        });
    });

    describe('createOrUpdateFile', () => {
        it('creates a new file when it does not exist', async () => {
            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ ok: false, status: 404 }) // GET (file doesn't exist)
                .mockResolvedValueOnce({ ok: true, status: 201 }); // PUT (create)

            vi.stubGlobal('fetch', fetchMock);

            const { createOrUpdateFile } = await import('../files.js');
            await createOrUpdateFile('owner/repo', 'docs/prd.md', '# PRD', 'test-token');
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        it('updates an existing file (sends sha)', async () => {
            const fetchMock = vi.fn()
                .mockResolvedValueOnce({
                    ok: true,
                    status: 200,
                    json: vi.fn().mockResolvedValue({ sha: 'abc123' }),
                }) // GET (file exists)
                .mockResolvedValueOnce({ ok: true, status: 200 }); // PUT (update)

            vi.stubGlobal('fetch', fetchMock);

            const { createOrUpdateFile } = await import('../files.js');
            await createOrUpdateFile('owner/repo', 'docs/prd.md', '# Updated PRD', 'test-token');

            const putBody = JSON.parse(fetchMock.mock.calls[1][1].body);
            expect(putBody.sha).toBe('abc123');
        });

        it('throws on PUT failure', async () => {
            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ ok: false, status: 404 }) // GET
                .mockResolvedValueOnce({
                    ok: false,
                    status: 422,
                    text: vi.fn().mockResolvedValue('Unprocessable'),
                }); // PUT fails

            vi.stubGlobal('fetch', fetchMock);

            const { createOrUpdateFile } = await import('../files.js');
            await expect(createOrUpdateFile('owner/repo', 'file.md', 'content', 'token'))
                .rejects.toThrow('GitHub createOrUpdateFile failed');
        });
    });
});
