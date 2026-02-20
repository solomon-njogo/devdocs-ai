import { describe, it, expect } from 'vitest';
import { buildPRDPrompt } from '../prd.js';

describe('buildPRDPrompt', () => {
    it('returns system and user prompt parts', () => {
        const result = buildPRDPrompt('Build a task manager app');
        expect(result).toHaveProperty('system');
        expect(result).toHaveProperty('user');
    });

    it('includes input in user prompt', () => {
        const result = buildPRDPrompt('Build a task manager app');
        expect(result.user).toContain('Build a task manager app');
    });

    it('includes PRD section headers in user prompt', () => {
        const result = buildPRDPrompt('test input');
        expect(result.user).toContain('Executive Summary');
        expect(result.user).toContain('Problem Statement');
        expect(result.user).toContain('Goals & Success Metrics');
        expect(result.user).toContain('User Personas');
        expect(result.user).toContain('Functional Requirements');
        expect(result.user).toContain('Non-Functional Requirements');
        expect(result.user).toContain('Technical Constraints');
        expect(result.user).toContain('Edge Cases');
        expect(result.user).toContain('Dependencies & Risks');
        expect(result.user).toContain('Timeline & Milestones');
    });

    it('passes context through to system prompt', () => {
        const result = buildPRDPrompt('test', { projectName: 'TestApp' });
        expect(result.system).toContain('TestApp');
    });
});
