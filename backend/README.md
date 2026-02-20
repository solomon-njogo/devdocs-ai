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
- `FRONTEND_ORIGIN` — Frontend URL for CORS and OAuth redirect (default: http://localhost:3000)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` — GitHub OAuth (e.g. `http://localhost:4000/api/auth/github/callback`)
- `WEBHOOK_SECRET` — Secret for verifying GitHub webhook signatures
- `OPENROUTER_API_KEY` — For ai-engine
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) — For db

## Webhook setup (doc sync)

To keep docs in sync on push, add a GitHub webhook to your repo:

1. Repo → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-api-host/api/webhooks/github`
3. Content type: `application/json`
4. Secret: same as `WEBHOOK_SECRET`
5. Events: "Just the push event"
