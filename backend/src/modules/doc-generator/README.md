# doc-generator

Orchestrates ai-engine + github. Workflow logic, merge/conflict resolution, high-level doc operations.

## Scope

- Generate docs using ai-engine
- Push updates via github module
- Merge and conflict resolution for existing docs
- Workflow orchestration

## Dependencies

- **Depends on:** `ai-engine`, `github`, `db`, `shared`
- **Import from:** `@/modules/ai-engine`, `@/modules/github`, `@/shared`

## Public API (index.ts)

```ts
generateAndPushPRD(repoId: string, input: string, token: string): Promise<{ path: string; content: string }>
```

## Conventions

- Workflow logic in `workflows/`
- Merge utilities in `merge.ts`
- Export only via `index.ts`
- This module orchestrates — it does not contain AI or GitHub primitives
