# Supabase migrations

SQL migrations for DevDocs AI. Creates `repo_meta` and `repo_tokens` tables used by the backend.

## Apply migrations

**Option A — Supabase CLI (linked project)**

```bash
# From repo root
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

**Option B — Supabase Dashboard**

1. Open your project → SQL Editor.
2. Run each file in `migrations/` in order (oldest timestamp first):
   - `20260215000000_create_repo_meta.sql`
   - `20260215000001_create_repo_tokens.sql`

**Option C — psql**

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/migrations/20260215000000_create_repo_meta.sql
psql "..." -f supabase/migrations/20260215000001_create_repo_tokens.sql
```

## Tables

| Table        | Purpose |
|-------------|---------|
| `repo_meta` | Repository metadata and last doc state (webhook sync). |
| `repo_tokens` | GitHub access token per repo (webhook needs token to push docs). |
