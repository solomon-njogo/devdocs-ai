import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
    usePathname: vi.fn(),
    useRouter: vi.fn(() => ({ replace: vi.fn() })),
}));

// Mock supabase client
vi.mock('@/lib/supabase', () => ({
    createSupabaseClient: vi.fn(),
}));

import { usePathname, useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';
import { AuthGuard } from '../AuthGuard';

describe('AuthGuard', () => {
    const mockReplace = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue({ replace: mockReplace } as ReturnType<typeof useRouter>);
    });

    it('renders children on non-protected paths', () => {
        vi.mocked(usePathname).mockReturnValue('/');
        render(<AuthGuard><div>Content</div></AuthGuard>);
        expect(screen.getByText('Content')).toBeInTheDocument();
    });

    it('renders children on login page', () => {
        vi.mocked(usePathname).mockReturnValue('/login');
        render(<AuthGuard><div>Login Page</div></AuthGuard>);
        expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    it('shows loading on protected path while checking', () => {
        vi.mocked(usePathname).mockReturnValue('/dashboard');
        vi.mocked(createSupabaseClient).mockReturnValue({
            auth: {
                getSession: vi.fn().mockReturnValue(new Promise(() => { })), // never resolves
            },
        } as ReturnType<typeof createSupabaseClient>);

        render(<AuthGuard><div>Dashboard</div></AuthGuard>);
        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('redirects to login when supabase client is null on protected path', () => {
        vi.mocked(usePathname).mockReturnValue('/dashboard');
        vi.mocked(createSupabaseClient).mockReturnValue(null);

        render(<AuthGuard><div>Dashboard</div></AuthGuard>);
        expect(mockReplace).toHaveBeenCalledWith('/login?redirect=%2Fdashboard');
    });
});
