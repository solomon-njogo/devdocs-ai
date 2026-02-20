import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('github/oauth', () => {
    beforeEach(() => {
        vi.stubEnv('GITHUB_CLIENT_ID', 'test-client-id');
        vi.stubEnv('GITHUB_CLIENT_SECRET', 'test-client-secret');
        vi.stubEnv('GITHUB_CALLBACK_URL', 'http://localhost:4000/api/auth/github/callback');
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    describe('getAuthorizationUrl', () => {
        it('returns a GitHub authorization URL', async () => {
            const { getAuthorizationUrl } = await import('../oauth.js');
            const url = getAuthorizationUrl();
            expect(url).toContain('https://github.com/login/oauth/authorize');
            expect(url).toContain('client_id=test-client-id');
            expect(url).toContain('scope=repo+read%3Auser');
        });

        it('includes state when provided', async () => {
            const { getAuthorizationUrl } = await import('../oauth.js');
            const url = getAuthorizationUrl('test-state-123');
            expect(url).toContain('state=test-state-123');
        });

        it('throws when GITHUB_CLIENT_ID is missing', async () => {
            vi.stubEnv('GITHUB_CLIENT_ID', '');
            const { getAuthorizationUrl } = await import('../oauth.js');
            expect(() => getAuthorizationUrl()).toThrow('GITHUB_CLIENT_ID is not set');
        });
    });

    describe('exchangeCodeForToken', () => {
        it('returns an access token on success', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ access_token: 'ghp_test_token' }),
            }));

            const { exchangeCodeForToken } = await import('../oauth.js');
            const token = await exchangeCodeForToken('test-code');
            expect(token).toBe('ghp_test_token');
        });

        it('throws on HTTP error', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: false,
                status: 400,
                text: vi.fn().mockResolvedValue('Bad request'),
            }));

            const { exchangeCodeForToken } = await import('../oauth.js');
            await expect(exchangeCodeForToken('bad-code')).rejects.toThrow('GitHub token exchange failed');
        });

        it('throws when GitHub returns an error in response body', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({ error: 'bad_verification_code' }),
            }));

            const { exchangeCodeForToken } = await import('../oauth.js');
            await expect(exchangeCodeForToken('bad-code')).rejects.toThrow('GitHub OAuth error');
        });

        it('throws when no access_token in response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({}),
            }));

            const { exchangeCodeForToken } = await import('../oauth.js');
            await expect(exchangeCodeForToken('code')).rejects.toThrow('GitHub did not return an access token');
        });

        it('throws when client credentials are missing', async () => {
            vi.stubEnv('GITHUB_CLIENT_ID', '');
            const { exchangeCodeForToken } = await import('../oauth.js');
            await expect(exchangeCodeForToken('code')).rejects.toThrow('GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is not set');
        });
    });
});
