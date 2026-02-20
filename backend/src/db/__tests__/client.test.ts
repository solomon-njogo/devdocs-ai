import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSupabase } from '../client.js';

describe('db/client', () => {
    beforeEach(() => {
        vi.stubEnv('SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('returns null when SUPABASE_URL is missing', () => {
        vi.stubEnv('SUPABASE_URL', '');
        // Need to reimport to reset the singleton
        vi.resetModules();
        return import('../client.js').then((mod) => {
            expect(mod.getSupabase()).toBeNull();
        });
    });

    it('returns null when both keys are missing', () => {
        vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
        delete process.env.SUPABASE_ANON_KEY;
        vi.resetModules();
        return import('../client.js').then((mod) => {
            expect(mod.getSupabase()).toBeNull();
        });
    });

    it('returns a SupabaseClient when env vars are set', () => {
        vi.resetModules();
        return import('../client.js').then((mod) => {
            const client = mod.getSupabase();
            expect(client).not.toBeNull();
        });
    });

    it('returns the same client on subsequent calls (singleton)', () => {
        vi.resetModules();
        return import('../client.js').then((mod) => {
            const client1 = mod.getSupabase();
            const client2 = mod.getSupabase();
            expect(client1).toBe(client2);
        });
    });
});
