# DevDocs AI
AI-powered Development Documentation Assistant

DevDocs AI automates generation and synchronization of software documentation directly from code and workflows. It integrates with GitHub, leverages AI prompts, and keeps docs up-to-date via webhooks.

## Objectives
- Auto-generate PRDs, user stories, architecture docs, API docs, and guides from minimal input.
- Secure GitHub integration for automated file management under /docs.
- Real-time sync with code changes via webhooks.
- Safe merge and conflict resolution for existing docs.

## Architecture (high level)
- Frontend: Next.js with SSR for dashboards and docs previews.
- Backend: Node.js services (or serverless) handling AI prompts, GitHub interactions, and webhooks.
- AI Engine: OpenRouter/GPT-4 for content generation and prompt orchestration.
- Data Layer: Supabase (or equivalent) for persistent state and metadata.
- Auth: Supabase Auth for identity (email + password; OAuth extensible). One `.env` at project root: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Backend verifies the Supabase JWT and uses `userId` for project ownership. GitHub OAuth is used only for *repo access* (Connect GitHub); tokens are stored per user.

## Project Structure
```
devdocs-ai/
├── frontend/           # Next.js dashboard & docs UI
├── backend/            # Node.js API
│   └── src/
│       ├── modules/
│       │   ├── ai-engine/    # LLM orchestration
│       │   ├── github/       # OAuth, file ops, webhooks
│       │   └── doc-generator/ # Orchestrates AI + GitHub
│       ├── shared/           # Types & contracts
│       ├── db/                # Supabase layer
│       └── routes/
├── docs/               # Generated documentation
├── scripts/
├── .cursor/rules/      # Router rules for AI agents
└── README.md
```

## Getting Started
Prerequisites:
- Node.js 18+ or Python 3.11+ (choose a backend)
- GitHub account with a repo to attach docs
- Environment variables: see `.env.example`. One root `.env`: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, GitHub OAuth keys, `NEXT_PUBLIC_API_BASE`.

1) Install dependencies
   - Node: npm install
   - Python: pip install -r requirements.txt (if using Python backend)
2) Configure environment
   - Copy .env.example to .env at project root and fill in values
3) Run locally
   - Node: npm run dev
4) Basic workflow
   - AI can generate PRDs and User Stories, create/modify files under /docs, and push updates via GitHub API.

## AI & Prompts (Overview)
- Prompt templates live in `backend/src/modules/ai-engine/prompts/` and `backend/src/modules/cie/generation/`.
- OpenRouter/GPT-4 models handle: PRDs, user stories, architecture docs, API docs, and changelogs.
- Prompt strategy uses CO-STAR plus XML-tagged boundaries (`instruction`, `context`, `objective`, `response_format`, `user_input`, `code_snippet`) to separate directives from untrusted user payloads.
- Evaluation: ensure docs reflect code structure and commits; use code-aware prompts.

## GitHub Integration
- OAuth flow for repo access; REST API calls for file read/write in /docs.
- Webhooks listen to pushes and trigger doc regeneration.
- Conflict resolution: smart merge that preserves existing docs.

## Data Model (conceptual)
- RepoMeta: repository metadata and last-doc-state
- DocItem: individual doc files under /docs with metadata (type, version, source)
- AITrace: prompt/version history for traceability

## Logging
- Backend uses a structured logger (colorized console + optional file). Set `LOG_LEVEL` (error|warn|info|debug) and optionally `LOG_DIR` or `LOG_FILE` for persistent JSON-lines logs. See [backend/src/logger/README.md](backend/src/logger/README.md) for setup and usage.

## Auth (user identity)
- **Sign-in**: Email + password via Supabase Auth. Sign-in and sign-up at `/login`; protected routes (`/`, `/onboarding`) require a valid session and redirect to `/login` when missing.
- **Backend**: All project and onboarding API requests require `Authorization: Bearer <access_token>` (Supabase JWT). The backend verifies the JWT using the shared Supabase URL and anon key and attaches `userId` to the request; project ownership is by `user_id` in the database.
- **Profiles**: `users_profile` table (one row per user) stores optional display name and avatar; created automatically on sign-up via trigger.
- **Extensibility**: Adding "Sign in with Google" or "Sign in with GitHub" (as identity) is done by enabling the provider in Supabase Auth and adding a button; no backend change to session or project ownership.
- **Redirect URLs**: In Supabase Dashboard → Auth → URL Configuration, add your frontend origin (e.g. `http://localhost:3000`) to Redirect URLs if using email confirmation.

## Security & Access
- Use least-privilege tokens; store secrets securely.
- Validate webhook signatures.

## CI / CD
- GitHub Actions to build docs on push, lint Markdown, run tests (if any).

## Contributing
- Follow standard CONTRIBUTING.md (to be added)
- Keep docs synchronized with code changes

## License
MIT License

## Changelog
- v0.1.0: Initial README and starter scaffold
