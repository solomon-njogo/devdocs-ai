import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock transports before importing logger
vi.mock('../transports.js', () => {
    const writeFn = vi.fn();
    return {
        createTransports: vi.fn(() => writeFn),
        __writeFn: writeFn,
    };
});

describe('logger/index', () => {
    let logger: typeof import('../index.js')['logger'];
    let writeFn: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
        vi.stubEnv('LOG_LEVEL', 'debug');
        vi.stubEnv('NODE_ENV', 'development');
        const mod = await import('../index.js');
        logger = mod.logger;
        // Access the mock write function
        const transports = await import('../transports.js');
        writeFn = (transports as unknown as { __writeFn: ReturnType<typeof vi.fn> }).__writeFn;
        writeFn.mockClear();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('logger.error calls write with level error', () => {
        logger.error('test error');
        expect(writeFn).toHaveBeenCalledWith(
            expect.objectContaining({ level: 'error', message: 'test error' })
        );
    });

    it('logger.warn calls write with level warn', () => {
        logger.warn('test warn');
        expect(writeFn).toHaveBeenCalledWith(
            expect.objectContaining({ level: 'warn', message: 'test warn' })
        );
    });

    it('logger.info calls write with level info', () => {
        logger.info('test info');
        expect(writeFn).toHaveBeenCalledWith(
            expect.objectContaining({ level: 'info', message: 'test info' })
        );
    });

    it('logger.debug calls write with level debug', () => {
        logger.debug('test debug');
        expect(writeFn).toHaveBeenCalledWith(
            expect.objectContaining({ level: 'debug', message: 'test debug' })
        );
    });

    it('passes context through to write', () => {
        logger.info('with context', { key: 'value' });
        expect(writeFn).toHaveBeenCalledWith(
            expect.objectContaining({
                context: { key: 'value' },
            })
        );
    });
});
