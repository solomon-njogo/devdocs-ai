import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ replace: vi.fn() })),
}));

vi.mock('@/lib/supabase', () => ({
    createSupabaseClient: vi.fn(),
}));

vi.mock('../theme-toggle', () => ({
    ThemeToggle: () => <div data-testid="theme-toggle">Toggle</div>,
}));

import { createSupabaseClient } from '@/lib/supabase';
import { UserMenu } from '../UserMenu';

describe('UserMenu', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders null when no user session', () => {
        vi.mocked(createSupabaseClient).mockReturnValue({
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                onAuthStateChange: vi.fn(() => ({
                    data: { subscription: { unsubscribe: vi.fn() } },
                })),
            },
        } as unknown as ReturnType<typeof createSupabaseClient>);

        const { container } = render(<UserMenu />);
        expect(container.firstChild).toBeNull();
    });

    it('renders null when supabase client is null', () => {
        vi.mocked(createSupabaseClient).mockReturnValue(null);
        const { container } = render(<UserMenu />);
        expect(container.firstChild).toBeNull();
    });
});
