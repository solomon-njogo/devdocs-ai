import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../theme-provider';

// Mock matchMedia for jsdom  
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Helper component that exposes theme context values
function TestConsumer() {
    const { theme, resolved, setTheme } = useTheme();
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="resolved">{resolved}</span>
            <button onClick={() => setTheme('dark')}>Set Dark</button>
            <button onClick={() => setTheme('light')}>Set Light</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
    });

    it('renders children', () => {
        render(
            <ThemeProvider>
                <div>Child</div>
            </ThemeProvider>
        );
        expect(screen.getByText('Child')).toBeInTheDocument();
    });

    it('defaults to system theme', () => {
        render(
            <ThemeProvider>
                <TestConsumer />
            </ThemeProvider>
        );
        expect(screen.getByTestId('theme')).toHaveTextContent('system');
    });

    it('provides setTheme that updates theme', async () => {
        render(
            <ThemeProvider>
                <TestConsumer />
            </ThemeProvider>
        );

        await act(async () => {
            screen.getByText('Set Dark').click();
        });

        expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
        expect(localStorage.getItem('devdocs-theme')).toBe('dark');
    });
});

describe('useTheme', () => {
    it('throws when used outside ThemeProvider', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => { });
        expect(() => render(<TestConsumer />)).toThrow('useTheme must be used within ThemeProvider');
        spy.mockRestore();
    });
});
