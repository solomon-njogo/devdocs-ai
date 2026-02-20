# Supabase migrations

SQL migrations for DevDocs AI. Creates `repo_meta`, `repo_tokens`, `projects`, and `project_docs` tables used by the backend.

## Apply migrations

**Option A — Supabase CLI (linked project)**

```bash
# From repo root (log in first if needed: supabase login)
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

**Option A2 — Supabase CLI (direct DB URL, no link)**

If link fails (e.g. access control), push using the database connection string. Get your DB password from Dashboard → Settings → Database.

```bash
# From repo root. Replace PASSWORD; percent-encode any special characters.
supabase db push --db-url "postgresql://postgres:PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

**Option B — Supabase Dashboard**

1. Open your project → SQL Editor.
2. Run each file in `migrations/` in order (oldest timestamp first):
   - `20260215000000_create_repo_meta.sql`
   - `20260215000001_create_repo_tokens.sql`
   - `20260215000002_create_projects.sql`
   - `20260215000003_create_project_docs.sql`
   - `20260215000004_add_project_id_to_repo_tables.sql`

**Option C — psql**

```bash
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f supabase/migrations/20260215000000_create_repo_meta.sql
psql "..." -f supabase/migrations/20260215000001_create_repo_tokens.sql
psql "..." -f supabase/migrations/20260215000002_create_projects.sql
psql "..." -f supabase/migrations/20260215000003_create_project_docs.sql
psql "..." -f supabase/migrations/20260215000004_add_project_id_to_repo_tables.sql
```

## Tables

| Table          | Purpose |
|----------------|---------|
| `repo_meta`    | Repository metadata and last doc state (webhook sync); `project_id` links to owning project. |
| `repo_tokens`  | GitHub access token per repo (webhook); `project_id` links to owning project. |
| `projects`     | First-class project entity; name, description, features, requirements; scoped by session. |
| `project_docs` | Generated docs (PRD, user stories, user journeys) linked to a project. |
