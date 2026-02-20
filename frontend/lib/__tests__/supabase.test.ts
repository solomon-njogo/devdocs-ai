import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../supabase-config', () => ({
    getSupabaseConfig: vi.fn(),
    setSupabaseConfig: vi.fn(),
}));

import { getSupabaseConfig } from '../supabase-config';

describe('lib/supabase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it('isSupabaseConfigured returns false when URL is empty', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({ url: '', anonKey: '' });
        const { isSupabaseConfigured } = await import('../supabase');
        expect(isSupabaseConfigured()).toBe(false);
    });

    it('isSupabaseConfigured returns false when anonKey is empty', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({ url: 'https://test.supabase.co', anonKey: '' });
        const { isSupabaseConfigured } = await import('../supabase');
        expect(isSupabaseConfigured()).toBe(false);
    });

    it('isSupabaseConfigured returns true when both are set', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({ url: 'https://test.supabase.co', anonKey: 'key' });
        const { isSupabaseConfigured } = await import('../supabase');
        expect(isSupabaseConfigured()).toBe(true);
    });

    it('createSupabaseClient returns a client when configured', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({ url: 'https://test.supabase.co', anonKey: 'test-key' });
        const { createSupabaseClient } = await import('../supabase');
        const client = createSupabaseClient();
        expect(client).not.toBeNull();
    });

    it('createSupabaseClient returns null when not configured', async () => {
        vi.mocked(getSupabaseConfig).mockReturnValue({ url: '', anonKey: '' });
        const { createSupabaseClient } = await import('../supabase');
        const client = createSupabaseClient();
        expect(client).toBeNull();
    });
});
