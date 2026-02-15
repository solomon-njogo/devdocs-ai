# DevDocs AI — Backend

Node.js API with modular architecture. See `.cursor/rules/devdocs-architecture.mdc` for AI-agent guidelines.

## Modules

- **ai-engine** — LLM calls, prompts, content generation
- **github** — OAuth, file ops, webhooks
- **doc-generator** — Orchestrates AI + GitHub
- **shared** — Types and contracts
- **db** — Supabase layer

## Run

```bash
npm run dev
```

API runs at http://localhost:4000

## Env

- `PORT` — API port (default: 4000)
- `OPENROUTER_API_KEY` — For ai-engine
- `GITHUB_TOKEN` — For GitHub API
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — For db
