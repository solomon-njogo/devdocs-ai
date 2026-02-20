import { describe, it, expect } from 'vitest';
import { buildUserStoriesPrompt } from '../user-stories.js';

describe('buildUserStoriesPrompt', () => {
    it('returns system and user prompt parts', () => {
        const result = buildUserStoriesPrompt('Build a task manager app');
        expect(result).toHaveProperty('system');
        expect(result).toHaveProperty('user');
    });

    it('includes input in user prompt', () => {
        const result = buildUserStoriesPrompt('Build a task manager app');
        expect(result.user).toContain('Build a task manager app');
    });

    it('includes user story format instructions', () => {
        const result = buildUserStoriesPrompt('test');
        expect(result.user).toContain('Story ID');
        expect(result.user).toContain('Acceptance Criteria');
        expect(result.user).toContain('Definition of Done');
        expect(result.user).toContain('SMART');
    });

    it('includes PRD reference when prdContent is provided', () => {
        const result = buildUserStoriesPrompt('test', { prdContent: 'PRD content here' });
        expect(result.user).toContain('PRD content here');
        expect(result.user).toContain('Reference: PRD');
    });

    it('omits PRD reference when prdContent is not provided', () => {
        const result = buildUserStoriesPrompt('test');
        expect(result.user).not.toContain('Reference: PRD');
    });
});
