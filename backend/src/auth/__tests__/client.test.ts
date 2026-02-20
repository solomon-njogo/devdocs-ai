import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('auth/client', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        vi.resetModules();
    });

    it('returns null when SUPABASE_URL is missing', async () => {
        vi.stubEnv('SUPABASE_URL', '');
        vi.stubEnv('SUPABASE_ANON_KEY', '');
        const mod = await import('../client.js');
        const result = await mod.getUserIdFromToken('some-token');
        expect(result).toBeNull();
    });

    it('returns null when SUPABASE_ANON_KEY is missing', async () => {
        vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('SUPABASE_ANON_KEY', '');
        const mod = await import('../client.js');
        const result = await mod.getUserIdFromToken('some-token');
        expect(result).toBeNull();
    });

    it('getSupabaseAuthClient returns null when env missing', async () => {
        vi.stubEnv('SUPABASE_URL', '');
        vi.stubEnv('SUPABASE_ANON_KEY', '');
        const mod = await import('../client.js');
        expect(mod.getSupabaseAuthClient()).toBeNull();
    });

    it('getSupabaseAuthClient returns a client when env is set', async () => {
        vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('SUPABASE_ANON_KEY', 'test-anon-key');
        const mod = await import('../client.js');
        const client = mod.getSupabaseAuthClient();
        expect(client).not.toBeNull();
    });
});
