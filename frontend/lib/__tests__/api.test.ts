import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../supabase', () => ({
    createSupabaseClient: vi.fn().mockReturnValue({
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'test-access-token' } },
            }),
        },
    }),
    isSupabaseConfigured: vi.fn().mockReturnValue(true),
}));

describe('lib/api', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('sends authenticated GET request', async () => {
        const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({ data: 'test' }) };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const { api } = await import('../api');
        const result = await api('/projects');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/projects'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-access-token',
                }),
            })
        );
        expect(result).toEqual({ data: 'test' });
    });

    it('sends POST request with body', async () => {
        const mockResponse = { ok: true, status: 200, json: vi.fn().mockResolvedValue({ id: 1 }) };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const { api } = await import('../api');
        const result = await api('/projects', {
            method: 'POST',
            body: { name: 'test' },
        });

        const fetchCall = vi.mocked(fetch).mock.calls[0];
        expect(fetchCall[1]?.method).toBe('POST');
        expect(result).toEqual({ id: 1 });
    });

    it('throws on non-ok response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: vi.fn().mockResolvedValue({ message: 'Server Error' }),
        }));

        const { api } = await import('../api');
        await expect(api('/projects')).rejects.toThrow('Server Error');
    });

    it('getAuthGitHubUrl returns a URL string', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({ url: 'https://github.com/login/oauth' }),
        }));

        const { getAuthGitHubUrl } = await import('../api');
        const result = await getAuthGitHubUrl();
        expect(result).toContain('github.com');
    });
});
