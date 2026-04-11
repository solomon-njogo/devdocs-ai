# doc-generator

Legacy onboarding doc generation: PRD, user stories, user journeys from ideas or repos.
For CIE-driven Diátaxis documentation, see the `cie` module.

## Scope

- Generate onboarding docs (PRD, user stories, user journeys) using ai-engine
- No longer pushes files to GitHub in v1 (Supabase-first)
- Workflow orchestration for the onboarding flow

## Dependencies

- **Depends on:** `ai-engine`, `github` (read only), `db`, `shared`

## Public API (index.ts)

```ts
generateDocsFromIdea(idea: NewIdeaRequest): Promise<Omit<NewIdeaResponse, "project">>
reviewAndPushDocs(repoId: string, token: string): Promise<ReviewRepoResult>
generateAndPushPRD(repoId: string, input: string, token: string): Promise<{ path: string; content: string }>
```

## Conventions

- Export only via `index.ts`
- This module orchestrates — it does not contain AI or GitHub primitives
