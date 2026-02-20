import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.ts', '**/*.test.tsx'],
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            include: ['lib/**/*.ts', 'components/**/*.tsx'],
            exclude: ['**/*.test.*'],
            thresholds: {
                lines: 80,
                functions: 80,
                branches: 80,
                statements: 80,
            },
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
});
