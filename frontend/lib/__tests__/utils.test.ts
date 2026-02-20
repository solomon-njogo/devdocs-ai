import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('lib/utils', () => {
    describe('cn', () => {
        it('merges class names', () => {
            expect(cn('foo', 'bar')).toBe('foo bar');
        });

        it('handles conditional classes', () => {
            expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
        });

        it('deduplicates Tailwind classes', () => {
            expect(cn('p-4', 'p-2')).toBe('p-2');
        });

        it('handles undefined and null', () => {
            expect(cn('base', undefined, null)).toBe('base');
        });

        it('handles empty input', () => {
            expect(cn()).toBe('');
        });

        it('handles arrays', () => {
            expect(cn(['foo', 'bar'])).toBe('foo bar');
        });
    });
});
