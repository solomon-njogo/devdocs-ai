import { describe, it, expect, beforeEach } from 'vitest';
import { setToken, getToken, deleteToken } from '../token-store.js';

describe('token-store', () => {
    const userId = 'user-123';
    const token = 'ghp_testtoken123';

    beforeEach(() => {
        // Clean up any leftover tokens
        deleteToken(userId);
    });

    describe('setToken / getToken', () => {
        it('stores and retrieves a token for a user', () => {
            setToken(userId, token);
            expect(getToken(userId)).toBe(token);
        });

        it('overwrites an existing token', () => {
            setToken(userId, 'old-token');
            setToken(userId, token);
            expect(getToken(userId)).toBe(token);
        });
    });

    describe('getToken', () => {
        it('returns null for a non-existent user', () => {
            expect(getToken('non-existent')).toBeNull();
        });
    });

    describe('deleteToken', () => {
        it('removes a stored token', () => {
            setToken(userId, token);
            deleteToken(userId);
            expect(getToken(userId)).toBeNull();
        });

        it('does not throw when deleting a non-existent token', () => {
            expect(() => deleteToken('non-existent')).not.toThrow();
        });
    });
});
