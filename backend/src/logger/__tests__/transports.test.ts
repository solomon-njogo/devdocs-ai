import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatJsonLine, formatConsole, createTransports, LEVEL_NUM, type LogEntry } from '../transports.js';

describe('logger/transports', () => {
    describe('formatJsonLine', () => {
        it('formats a log entry as a JSON line', () => {
            const entry: LogEntry = {
                level: 'info',
                message: 'test message',
                time: '2026-01-01T00:00:00.000Z',
            };
            const line = formatJsonLine(entry);
            const parsed = JSON.parse(line);
            expect(parsed.level).toBe('info');
            expect(parsed.message).toBe('test message');
            expect(parsed.time).toBe('2026-01-01T00:00:00.000Z');
            expect(line.endsWith('\n')).toBe(true);
        });

        it('serializes Error objects in context', () => {
            const entry: LogEntry = {
                level: 'error',
                message: 'error occurred',
                time: '2026-01-01T00:00:00.000Z',
                context: { error: new Error('test error') },
            };
            const line = formatJsonLine(entry);
            const parsed = JSON.parse(line);
            expect(parsed.context.error.message).toBe('test error');
            expect(parsed.context.error.name).toBe('Error');
        });

        it('excludes context if empty', () => {
            const entry: LogEntry = {
                level: 'info',
                message: 'no context',
                time: '2026-01-01T00:00:00.000Z',
                context: {},
            };
            const line = formatJsonLine(entry);
            const parsed = JSON.parse(line);
            expect(parsed.context).toBeUndefined();
        });
    });

    describe('formatConsole', () => {
        it('includes level and message in output', () => {
            const entry: LogEntry = {
                level: 'warn',
                message: 'warning message',
                time: '2026-01-01T00:00:00.000Z',
            };
            const output = formatConsole(entry);
            expect(output).toContain('WARN');
            expect(output).toContain('warning message');
        });

        it('includes truncated context when present', () => {
            const entry: LogEntry = {
                level: 'info',
                message: 'with context',
                time: '2026-01-01T00:00:00.000Z',
                context: { key: 'value' },
            };
            const output = formatConsole(entry);
            expect(output).toContain('with context');
            expect(output).toContain('key');
        });
    });

    describe('createTransports', () => {
        it('writes to stdout for entries at or below config level', () => {
            const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
            const transport = createTransports({ level: 'info' });
            transport({ level: 'info', message: 'test', time: new Date().toISOString() });
            expect(stdoutSpy).toHaveBeenCalled();
            stdoutSpy.mockRestore();
        });

        it('skips entries above config level', () => {
            const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
            const transport = createTransports({ level: 'warn' });
            transport({ level: 'debug', message: 'should be skipped', time: new Date().toISOString() });
            expect(stdoutSpy).not.toHaveBeenCalled();
            stdoutSpy.mockRestore();
        });
    });

    describe('LEVEL_NUM', () => {
        it('has correct ordering', () => {
            expect(LEVEL_NUM.error).toBeLessThan(LEVEL_NUM.warn);
            expect(LEVEL_NUM.warn).toBeLessThan(LEVEL_NUM.info);
            expect(LEVEL_NUM.info).toBeLessThan(LEVEL_NUM.debug);
        });
    });
});
