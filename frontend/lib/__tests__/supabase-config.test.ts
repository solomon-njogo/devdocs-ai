import { describe, it, expect, beforeEach } from 'vitest';
import { setSupabaseConfig, getSupabaseConfig } from '../supabase-config';

describe('lib/supabase-config', () => {
    it('sets and retrieves config', () => {
        setSupabaseConfig('https://test.supabase.co', 'test-anon-key');
        const config = getSupabaseConfig();
        expect(config).not.toBeNull();
        expect(config!.url).toBe('https://test.supabase.co');
        expect(config!.anonKey).toBe('test-anon-key');
    });

    it('returns null when set with empty values', () => {
        setSupabaseConfig('', '');
        const config = getSupabaseConfig();
        expect(config).toBeNull();
    });

    it('overwrites previous config', () => {
        setSupabaseConfig('url1', 'key1');
        setSupabaseConfig('url2', 'key2');
        const config = getSupabaseConfig();
        expect(config!.url).toBe('url2');
        expect(config!.anonKey).toBe('key2');
    });

    it('returns null when url is empty', () => {
        setSupabaseConfig('', 'key');
        expect(getSupabaseConfig()).toBeNull();
    });

    it('returns null when anonKey is empty', () => {
        setSupabaseConfig('url', '');
        expect(getSupabaseConfig()).toBeNull();
    });
});
