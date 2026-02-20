import { describe, it, expect } from 'vitest';
import { colors, spacing, layout, zIndex, breakpoints } from '../design-tokens';

describe('lib/design-tokens', () => {
    it('exports colors object with expected keys', () => {
        expect(colors).toBeDefined();
        expect(typeof colors).toBe('object');
        expect(Object.keys(colors).length).toBeGreaterThan(0);
    });

    it('exports spacing object', () => {
        expect(spacing).toBeDefined();
        expect(typeof spacing).toBe('object');
    });

    it('exports layout object', () => {
        expect(layout).toBeDefined();
        expect(typeof layout).toBe('object');
    });

    it('exports zIndex object', () => {
        expect(zIndex).toBeDefined();
        expect(typeof zIndex).toBe('object');
    });

    it('exports breakpoints object', () => {
        expect(breakpoints).toBeDefined();
        expect(typeof breakpoints).toBe('object');
    });

    it('colors leaf values are strings', () => {
        function checkLeafStrings(obj: Record<string, unknown>) {
            for (const value of Object.values(obj)) {
                if (typeof value === 'object' && value !== null) {
                    checkLeafStrings(value as Record<string, unknown>);
                } else {
                    expect(typeof value).toBe('string');
                }
            }
        }
        checkLeafStrings(colors as Record<string, unknown>);
    });

    it('zIndex values are numbers', () => {
        for (const value of Object.values(zIndex)) {
            expect(typeof value).toBe('number');
        }
    });
});
