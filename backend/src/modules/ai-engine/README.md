# ai-engine

Handles all LLM calls (OpenRouter/GPT-4). Generates PRDs, user stories, API docs, changelogs, and architecture docs.

## Scope

- Prompt templates and orchestration
- Provider abstraction (OpenRouter, etc.)
- Content generation (PRD, user stories, API docs, changelogs)

## Dependencies

- **Depends on:** `shared` only
- **Do NOT import:** `github`, `doc-generator`, `db`

## Public API (index.ts)

```ts
generatePRD(input: string, context?: Record<string, unknown>): Promise<string>
generateUserStories(input: string, context?: Record<string, unknown>): Promise<string>
generateUserJourneys(input: string, context?: Record<string, unknown>): Promise<string>
generateApiDocs(input: string, context?: Record<string, unknown>): Promise<string>
complete(prompt: string, options?: CompleteOptions): Promise<string>
embed(text: string): Promise<number[]>
embedBatch(texts: string[]): Promise<number[][]>
```

## Conventions

- All prompts live in `prompts/`
- Provider logic in `providers/`
- Export only via `index.ts` — no deep imports from other modules
