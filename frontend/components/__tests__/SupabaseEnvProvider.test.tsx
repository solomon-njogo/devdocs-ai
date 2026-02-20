import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/supabase-config', () => ({
    setSupabaseConfig: vi.fn(),
}));

import { setSupabaseConfig } from '@/lib/supabase-config';
import { SupabaseEnvProvider } from '../SupabaseEnvProvider';

describe('SupabaseEnvProvider', () => {
    it('calls setSupabaseConfig with url and anonKey', () => {
        render(
            <SupabaseEnvProvider url="https://test.supabase.co" anonKey="test-key">
                <div>Child</div>
            </SupabaseEnvProvider>
        );

        expect(setSupabaseConfig).toHaveBeenCalledWith('https://test.supabase.co', 'test-key');
    });

    it('renders children', () => {
        render(
            <SupabaseEnvProvider url="" anonKey="">
                <div>Child Content</div>
            </SupabaseEnvProvider>
        );

        expect(screen.getByText('Child Content')).toBeInTheDocument();
    });
});
