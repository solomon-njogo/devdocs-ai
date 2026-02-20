import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../../logger/index.js', () => ({
    logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

describe('openrouter provider', () => {
    beforeEach(() => {
        vi.stubEnv('OPENROUTER_API_KEY', 'test-api-key');
        vi.stubEnv('OPENROUTER_MODEL', 'test-model');
        vi.resetModules();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('throws when OPENROUTER_API_KEY is missing', async () => {
        vi.stubEnv('OPENROUTER_API_KEY', '');
        const { complete } = await import('../openrouter.js');
        await expect(complete('test prompt')).rejects.toThrow('OPENROUTER_API_KEY is not set');
    });

    it('returns content on successful response', async () => {
        const mockResponse = {
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                choices: [{ message: { content: 'Generated content' } }],
            }),
        };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        const { complete } = await import('../openrouter.js');
        const result = await complete('test prompt');
        expect(result).toBe('Generated content');
    });

    it('sends system prompt when provided', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({
                choices: [{ message: { content: 'result' } }],
            }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const { complete } = await import('../openrouter.js');
        await complete('test prompt', { systemPrompt: 'You are helpful.' });

        const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
        expect(callBody.messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ role: 'system', content: 'You are helpful.' }),
                expect.objectContaining({ role: 'user', content: 'test prompt' }),
            ])
        );
    });

    it('throws on non-ok, non-429 response', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            text: vi.fn().mockResolvedValue('server error'),
        }));

        const { complete } = await import('../openrouter.js');
        await expect(complete('test')).rejects.toThrow('OpenRouter request failed: 500');
    });

    it('throws when response has no content', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: vi.fn().mockResolvedValue({ choices: [] }),
        }));

        const { complete } = await import('../openrouter.js');
        await expect(complete('test')).rejects.toThrow('OpenRouter returned no content');
    });

    it('exports RATE_LIMIT_EXHAUSTED constant', async () => {
        const { RATE_LIMIT_EXHAUSTED } = await import('../openrouter.js');
        expect(RATE_LIMIT_EXHAUSTED).toBe('RATE_LIMIT_EXHAUSTED');
    });
});
