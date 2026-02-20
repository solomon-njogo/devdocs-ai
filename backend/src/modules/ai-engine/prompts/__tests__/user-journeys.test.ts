import { describe, it, expect } from 'vitest';
import { buildUserJourneysPrompt } from '../user-journeys.js';

describe('buildUserJourneysPrompt', () => {
    it('returns system and user prompt parts', () => {
        const result = buildUserJourneysPrompt('Build a task manager app');
        expect(result).toHaveProperty('system');
        expect(result).toHaveProperty('user');
    });

    it('includes input in user prompt', () => {
        const result = buildUserJourneysPrompt('Build a task manager app');
        expect(result.user).toContain('Build a task manager app');
    });

    it('includes JTBD and journey stage instructions', () => {
        const result = buildUserJourneysPrompt('test');
        expect(result.user).toContain('Jobs-to-be-Done');
        expect(result.user).toContain('Awareness');
        expect(result.user).toContain('Onboarding');
        expect(result.user).toContain('Core Usage');
        expect(result.user).toContain('Retention');
    });

    it('includes PRD reference when prdContent is provided', () => {
        const result = buildUserJourneysPrompt('test', { prdContent: 'PRD content here' });
        expect(result.user).toContain('PRD content here');
        expect(result.user).toContain('Reference: PRD');
    });

    it('omits PRD reference when not provided', () => {
        const result = buildUserJourneysPrompt('test');
        expect(result.user).not.toContain('Reference: PRD');
    });
});
