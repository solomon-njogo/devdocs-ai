# db

Data layer: Supabase (or equivalent) for persistent state and metadata.

## Scope

- Supabase client setup
- RepoMeta, DocItem, AITrace CRUD
- Migrations

## Dependencies

- **Depends on:** `shared` only
- **Do NOT import:** `ai-engine`, `github`, `doc-generator`

## Conventions

- Models in `models/`
- Repositories in `repositories/`
- Migrations in `migrations/`
