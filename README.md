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
- Auth: GitHub OAuth to access repositories.

## Project Structure (starter)
- /docs          - Markdown documentation generated and stored here
- /src           - Core application logic
- /ai            - AI prompt templates and orchestration
- /scripts       - Utility scripts (setup, migrations, CI)
- .github/workflows - CI workflows
- README.md      - This document

## Getting Started
Prerequisites:
- Node.js 18+ or Python 3.11+ (choose a backend)
- GitHub account with a repo to attach docs
- Environment variables: OPENROUTER_API_KEY, GITHUB_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_API_BASE, etc.

1) Install dependencies
   - Node: npm install
   - Python: pip install -r requirements.txt (if using Python backend)
2) Configure environment
   - Create a .env.local with required keys (see .env.example)
3) Run locally
   - Node: npm run dev
4) Basic workflow
   - AI can generate PRDs and User Stories, create/modify files under /docs, and push updates via GitHub API.

## AI & Prompts (Overview)
- Prompt templates live in /devdocs-ai/ai or /src/ai.
- OpenRouter/GPT-4 models handle: PRDs, user stories, architecture docs, API docs, and changelogs.
- Evaluation: ensure docs reflect code structure and commits; use code-aware prompts.

## GitHub Integration
- OAuth flow for repo access; REST API calls for file read/write in /docs.
- Webhooks listen to pushes and trigger doc regeneration.
- Conflict resolution: smart merge that preserves existing docs.

## Data Model (conceptual)
- RepoMeta: repository metadata and last-doc-state
- DocItem: individual doc files under /docs with metadata (type, version, source)
- AITrace: prompt/version history for traceability

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
