import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { verifyWebhookSignature } from '../webhooks.js';

describe('github/webhooks', () => {
    const secret = 'test-webhook-secret';
    const payload = '{"action": "push"}';

    function createValidSignature(body: string, sec: string): string {
        return 'sha256=' + crypto.createHmac('sha256', sec).update(body).digest('hex');
    }

    it('returns true for a valid signature', () => {
        const signature = createValidSignature(payload, secret);
        expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it('returns false for an invalid signature', () => {
        expect(verifyWebhookSignature(payload, 'sha256=invalid', secret)).toBe(false);
    });

    it('returns false when signature is empty', () => {
        expect(verifyWebhookSignature(payload, '', secret)).toBe(false);
    });

    it('returns false when secret is empty', () => {
        expect(verifyWebhookSignature(payload, 'sha256=abc', '')).toBe(false);
    });

    it('returns false for a mismatched payload', () => {
        const signature = createValidSignature('different payload', secret);
        expect(verifyWebhookSignature(payload, signature, secret)).toBe(false);
    });
});
