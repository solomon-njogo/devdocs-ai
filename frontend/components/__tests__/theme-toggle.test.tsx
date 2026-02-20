import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the theme provider hook
vi.mock('../theme-provider', () => ({
    useTheme: vi.fn(),
}));

import { useTheme } from '../theme-provider';
import { ThemeToggle } from '../theme-toggle';

describe('ThemeToggle', () => {
    const mockSetTheme = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a button with light theme label', () => {
        vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme: mockSetTheme, resolved: 'light' });
        render(<ThemeToggle />);
        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('aria-label', expect.stringContaining('Light mode'));
    });

    it('cycles from light to dark on click', () => {
        vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme: mockSetTheme, resolved: 'light' });
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('cycles from dark to system on click', () => {
        vi.mocked(useTheme).mockReturnValue({ theme: 'dark', setTheme: mockSetTheme, resolved: 'dark' });
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetTheme).toHaveBeenCalledWith('system');
    });

    it('cycles from system to light on click', () => {
        vi.mocked(useTheme).mockReturnValue({ theme: 'system', setTheme: mockSetTheme, resolved: 'light' });
        render(<ThemeToggle />);
        fireEvent.click(screen.getByRole('button'));
        expect(mockSetTheme).toHaveBeenCalledWith('light');
    });
});
