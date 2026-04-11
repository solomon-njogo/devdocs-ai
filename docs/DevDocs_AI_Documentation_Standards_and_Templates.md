**DevDocs AI**

**DevDocs AI**

**Documentation Standards, Examples & Templates**

How big tech companies document their code --- and how to replicate it

+-----------------------------------------------------------------------+
| Based on public documentation systems from:                           |
|                                                                       |
| **Stripe · Vercel · Supabase · GitHub · Twilio · Linear · Notion**    |
+-----------------------------------------------------------------------+

**Part 1: The Framework Every Great Docs System Uses**

Every company with world-class documentation --- Stripe, Vercel, GitHub,
Supabase --- independently arrived at the same underlying structure. It
has a name: **Diátaxis** (from the Greek for \'arrangement\'). It was
formalized by Daniele Procida and is now the de facto standard for
technical documentation.

The insight is simple: readers come to documentation in four completely
different mental states, and trying to serve all four states with one
document type fails all of them.

  -----------------------------------------------------------------------
  **Layer**        **Reader\'s mental       **Reader\'s question**
                   state**                  
  ---------------- ------------------------ -----------------------------
  L1 --- Concept   Learning, exploring      \"What even is this? Why does
  guide                                     it exist?\"

  L2 ---           Getting started,         \"Can I get something working
  Quickstart /     motivated                right now?\"
  tutorial                                  

  L3 --- How-to    Solving a specific       \"How do I do X in this
  guide            problem                  system?\"

  L4 --- API       Working, looking         \"What are the exact params
  reference        something up             for this method?\"
  -----------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **The cardinal rule**                                                 |
|                                                                       |
| Never mix layers in a single document. A concept guide that starts    |
| teaching you commands has failed as a concept guide. An API reference |
| that explains philosophy has failed as a reference. DevDocs AI        |
| generates each layer as a separate file, committed to a separate      |
| folder.                                                               |
+-----------------------------------------------------------------------+

**How the best companies map this**

**Stripe:** \'Payments\' is a concept guide. \'Accept a payment\' is a
quickstart. \'Handle payment errors\' is a how-to. \'PaymentIntent
object\' is a reference. All four link to each other.

**Vercel:** \'Edge Runtime\' is a concept guide. \'Deploy your first
project\' is a quickstart. \'Configure redirects\' is a how-to.
\'vercel.json schema\' is a reference.

**Supabase:** \'Row Level Security\' is a concept guide. \'Build a todo
app with React\' is a tutorial. \'Set up email auth\' is a how-to.
\'supabase.from().select()\' is a reference.

**GitHub:** \'About pull requests\' is a concept guide. \'Create your
first repository\' is a quickstart. \'Resolve merge conflicts\' is a
how-to. \'REST API endpoints for pulls\' is a reference.

**Part 2: Layer 4 --- The API Reference**

+----------+-----------------------------------------------------------+
| **L4**   | **API Reference**                                         |
|          |                                                           |
|          | Auto-generated from code. Exhaustive. Searched, not read  |
|          | linearly.                                                 |
+----------+-----------------------------------------------------------+

The API reference is the layer DevDocs AI generates first and best,
because it comes directly from parsing the codebase. It should be 100%
complete, machine-precise, and never contain opinions or explanations
--- only facts about the code.

Below is a real-world example modelled on how Stripe, Supabase, and
GitHub document their API endpoints, adapted to show what DevDocs AI
would generate for a typical Next.js API route.

**2.1 Real example: Stripe-style endpoint documentation**

+-----------------------------------------------------------------------+
| **Context**                                                           |
|                                                                       |
| Stripe\'s API reference is the gold standard. Every endpoint follows  |
| an identical structure. A developer scanning it never has to figure   |
| out where to look --- the answer is always in the same place.         |
+-----------------------------------------------------------------------+

**Template --- Single endpoint**

> markdown
>
> \## POST /api/v1/projects/:id/index
>
> Triggers a full codebase indexing job for a connected repository.
>
> Returns immediately with a job ID. Indexing runs asynchronously.
>
> \### Authentication
>
> Requires a valid Bearer token in the Authorization header.
>
> The authenticated user must be the owner of the project.
>
> \### Path parameters
>
> \| Parameter \| Type \| Required \| Description \|
>
> \|\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| id \| string \| Yes \| The UUID of the project to index. \|
>
> \### Request body
>
> \`\`\`json
>
> {
>
> \"branch\": \"main\",
>
> \"force\": false
>
> }
>
> \`\`\`
>
> \| Field \| Type \| Required \| Default \| Description \|
>
> \|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| branch \| string \| No \| main \| The git branch to index. \|
>
> \| force \| boolean \| No \| false \| Re-index even if the branch SHA
> hasn\'t changed. \|
>
> \### Response
>
> \*\*202 Accepted\*\*
>
> \`\`\`json
>
> {
>
> \"job_id\": \"job_01HX2Y3Z\...\",
>
> \"status\": \"queued\",
>
> \"project_id\": \"proj_01HX2Y3Z\...\",
>
> \"estimated_minutes\": 3
>
> }
>
> \`\`\`
>
> \*\*403 Forbidden\*\* --- Returned when the authenticated user does
> not own the project.
>
> \`\`\`json
>
> {
>
> \"error\": { \"code\": \"not_authorized\",
>
> \"message\": \"You do not have access to this project.\" }
>
> }
>
> \`\`\`
>
> \*\*409 Conflict\*\* --- Returned when an indexing job is already in
> progress.
>
> \`\`\`json
>
> {
>
> \"error\": { \"code\": \"already_indexing\",
>
> \"message\": \"An indexing job is already running for this project.\",
>
> \"job_id\": \"job_01HX2Y3Z\...\" }
>
> }
>
> \`\`\`
>
> \### Example request
>
> \`\`\`bash
>
> curl -X POST https://devdocsai.com/api/v1/projects/proj_01HX2Y3Z/index
> \\
>
> -H \'Authorization: Bearer sk_live\_\...\' \\
>
> -H \'Content-Type: application/json\' \\
>
> -d \'{ \"branch\": \"main\", \"force\": false }\'
>
> \`\`\`
>
> \### Related
>
> \- GET /api/v1/projects/:id/index/status --- Poll indexing progress
>
> \- POST /api/v1/projects/:id/generate --- Generate docs after indexing

**2.2 What DevDocs AI auto-generates into this template**

When DevDocs AI scans your Next.js API routes, it extracts the following
and populates the template above automatically:

-   **HTTP method and path:** from the route file name and exported
    handler functions (GET, POST, etc.)

-   **Path and query parameters:** from destructured params in the route
    handler and Zod/TypeScript type annotations

-   **Request body schema:** from Zod schemas, TypeScript interfaces, or
    inferred from the handler

-   **Response shapes:** from return type annotations and explicit
    NextResponse.json() calls

-   **Authentication requirements:** from middleware checks
    (supabase.auth.getSession() calls, route guard wrappers)

-   **Error responses:** from explicit error return paths in the handler

**Part 3: Layer 3 --- The How-To Guide**

+----------+-----------------------------------------------------------+
| **L3**   | **How-to guide**                                          |
|          |                                                           |
|          | Goal-oriented. Reader has a task. Tells them how to       |
|          | accomplish it.                                            |
+----------+-----------------------------------------------------------+

A how-to guide assumes the reader already understands the system and
just needs to accomplish a specific task. It is the most common
documentation type in mature products. GitHub\'s support center is
almost entirely how-to guides. So is Vercel\'s.

**The key discipline:** every how-to guide has exactly one goal. If you
find yourself writing \'and while you\'re here, also do this other
thing\', that\'s a second how-to guide. Split it.

**3.1 Real example: GitHub-style how-to guide**

**Template --- How to handle webhook signature validation**

> markdown
>
> \# How to validate GitHub webhook signatures in Next.js
>
> GitHub signs every webhook payload with an HMAC-SHA256 signature using
> your
>
> webhook secret. You must validate this signature before processing any
> event.
>
> Skipping this step means any actor who knows your webhook URL can send
>
> arbitrary events to your endpoint.
>
> \## Prerequisites
>
> \- A registered GitHub webhook with a secret set
>
> \- The webhook secret stored as GITHUB_WEBHOOK_SECRET in your
> .env.local
>
> \- A Next.js API route at /api/webhook/github
>
> \## Steps
>
> \### 1. Read the raw request body
>
> The signature is computed over the raw bytes of the body, not the
> parsed JSON.
>
> You must disable Next.js body parsing for this route.
>
> \`\`\`typescript
>
> // src/app/api/webhook/github/route.ts
>
> export const runtime = \'edge\'; // or disable bodyParser in pages
> router
>
> export async function POST(req: Request) {
>
> const body = await req.text(); // raw string, not JSON.parse()
>
> \`\`\`
>
> \### 2. Compute the expected signature
>
> \`\`\`typescript
>
> const secret = process.env.GITHUB_WEBHOOK_SECRET!;
>
> const encoder = new TextEncoder();
>
> const key = await crypto.subtle.importKey(
>
> \'raw\', encoder.encode(secret), { name: \'HMAC\', hash: \'SHA-256\'
> }, false, \[\'sign\'\]
>
> );
>
> const sig = await crypto.subtle.sign(\'HMAC\', key,
> encoder.encode(body));
>
> const expected = \'sha256=\' + Buffer.from(sig).toString(\'hex\');
>
> \`\`\`
>
> \### 3. Compare using a timing-safe function
>
> Never use === to compare signatures. Use timingSafeEqual to prevent
>
> timing attacks that could reveal partial signature information.
>
> \`\`\`typescript
>
> import { timingSafeEqual } from \'crypto\';
>
> const received = req.headers.get(\'x-hub-signature-256\') ?? \'\';
>
> const match = timingSafeEqual(
>
> Buffer.from(expected), Buffer.from(received)
>
> );
>
> if (!match) return new Response(\'Unauthorized\', { status: 401 });
>
> \`\`\`
>
> \### 4. Process the event
>
> Only process the event after signature validation passes.
>
> \`\`\`typescript
>
> const event = JSON.parse(body);
>
> const eventType = req.headers.get(\'x-github-event\');
>
> if (eventType === \'push\') {
>
> await inngest.send({ name: \'github/push\', data: event });
>
> }
>
> return new Response(\'OK\', { status: 200 });
>
> }
>
> \`\`\`
>
> \## Troubleshooting
>
> \*\*Signature mismatch despite correct secret\*\*
>
> The most common cause is that the body was parsed before reaching your
>
> validation code. Make sure no middleware (e.g. a JSON body parser) is
>
> consuming the stream before you read it with req.text().
>
> \*\*Invalid MAC length error from timingSafeEqual\*\*
>
> Both buffers passed to timingSafeEqual must be the same length.
>
> If the received header is empty or malformed, pad or reject early.
>
> \## Related guides
>
> \- How to register a webhook with GitHub\'s API
>
> \- How to process push events with Inngest
>
> \- How to test webhooks locally with the Stripe CLI

**3.2 Anatomy of a perfect how-to guide**

  -----------------------------------------------------------------------
  **Element**         **Rule**
  ------------------- ---------------------------------------------------
  Title               Always starts with \'How to\'. Never \'Webhooks\'
                      (too vague) or \'Understanding webhooks\' (that\'s
                      a concept guide).

  Opening paragraph   One sentence on what the guide does and one
                      sentence on why it matters. No theory.

  Prerequisites       Explicit list. The reader should know exactly what
                      state they need to be in before starting.

  Steps               Numbered. Each step is a single action with a code
                      block if applicable. No step should say \'and then
                      also\'.

  Troubleshooting     The 2-3 most common failure modes, as bold headers,
                      each with a specific fix.

  Related guides      Links only --- never inline explanation. The reader
                      is task-focused; don\'t distract them.
  -----------------------------------------------------------------------

**Part 4: Layer 2 --- The Quickstart / Tutorial**

+----------+-----------------------------------------------------------+
| **L2**   | **Quickstart / Tutorial**                                 |
|          |                                                           |
|          | Gets the reader to a working result as fast as possible.  |
|          | Opinionated.                                              |
+----------+-----------------------------------------------------------+

A quickstart\'s only job is to give the reader a working, meaningful
result as fast as possible --- ideally under 10 minutes. It makes every
decision for them: which tool, which command, which option. It is
opinionated by design. This is how Supabase\'s \'Build a todo app\'
works, and it is the most-read page in most products.

**What it is NOT:** A quickstart is not a reference, not a comprehensive
tutorial, and not a beginner-friendly intro to programming. It assumes
familiarity with the ecosystem (Node.js, git, basic web concepts). It
teaches the product, not fundamentals.

**4.1 Real example: Supabase / Vercel-style quickstart**

**Template --- Connect your first repository to DevDocs AI**

> markdown
>
> \# Quickstart: Generate documentation for your first repository
>
> In this guide you will connect a GitHub repository to DevDocs AI,
>
> trigger an index, and generate a complete /docs folder --- in under
>
> 10 minutes.
>
> \## Before you begin
>
> You will need:
>
> \- A DevDocs AI account (sign up at devdocsai.com)
>
> \- A GitHub account with at least one repository
>
> \- The repository must be public, or you must have granted DevDocs AI
>
> access to private repos during OAuth
>
> \## Step 1: Connect your GitHub account
>
> 1\. Go to devdocsai.com/dashboard and click \*\*Add project\*\*.
>
> 2\. Select \*\*Connect GitHub\*\*. You will be redirected to GitHub.
>
> 3\. Authorize DevDocs AI to access your repositories.
>
> 4\. You are redirected back to the DevDocs AI dashboard.
>
> \## Step 2: Select a repository
>
> 1\. Click \*\*Select repository\*\* in your new project.
>
> 2\. Choose the repository you want to document.
>
> 3\. Select the branch to track (usually \`main\`).
>
> 4\. Click \*\*Connect repository\*\*.
>
> DevDocs AI immediately begins scanning your repository structure.
>
> This takes about 30 seconds.
>
> \## Step 3: Start indexing
>
> Once the repository is connected, click \*\*Index codebase\*\*.
>
> The indexer reads every file in your repository, extracts all
>
> functions, classes, and imports, and builds a semantic search index.
>
> For a typical 50--200 file project, indexing takes 1--3 minutes.
>
> You will see a live progress bar.
>
> \## Step 4: Generate your documentation
>
> Once indexing completes, click \*\*Generate docs\*\*.
>
> DevDocs AI will generate and commit the following files to your
>
> repository\'s /docs folder:
>
> \`\`\`
>
> docs/
>
> README.md Auto-generated project overview
>
> ARCHITECTURE.md Module map and system design
>
> GETTING_STARTED.md Setup guide for new developers
>
> ENVIRONMENT.md Every environment variable, documented
>
> api/
>
> \[your-endpoints\].md One file per API route
>
> modules/
>
> \[your-modules\].md One guide per major feature
>
> \`\`\`
>
> Generation takes 2--5 minutes depending on project size.
>
> \## Step 5: Review and merge
>
> DevDocs AI opens a pull request on your repository with the
>
> generated /docs folder. Review it, make any edits, and merge.
>
> After merging, DevDocs AI will automatically keep these docs in
>
> sync with your code on every push.
>
> \## What\'s next
>
> \- \[Customize what gets documented\](./how-to/configure-doc-scope.md)
>
> \- \[Set up Slack notifications on doc
> updates\](./how-to/slack-notifications.md)
>
> \- \[Understand how the indexer
> works\](./concepts/codebase-indexing.md)

**4.2 The Vercel principle: fewer words, more trust**

Vercel\'s quickstarts are famously terse. They do not explain why each
step works. They assume you will figure that out, or read the concept
guides later. This is deliberate --- a developer in \'getting started\'
mode does not want an essay. They want the next command.

+-----------------------------------------------------------------------+
| **Rule**                                                              |
|                                                                       |
| If a sentence in a quickstart starts with \'This works because\...\'  |
| or \'Note that\...\', delete it. Put it in a concept guide and link   |
| to it.                                                                |
+-----------------------------------------------------------------------+

**Part 5: Layer 1 --- The Concept Guide**

+----------+-----------------------------------------------------------+
| **L1**   | **Concept guide**                                         |
|          |                                                           |
|          | Pure explanation. No tasks. Builds mental models.         |
+----------+-----------------------------------------------------------+

A concept guide explains the \'what\' and \'why\' --- without ever
telling you to do anything. There are no step numbers. No \'click
here\'. No code the reader is expected to run. Its only purpose is to
build an accurate mental model.

**The Stripe example:** Stripe\'s \'How payments work\' page explains
money movement, settlement, authorization holds, and why payment intents
exist. It has no commands. A developer who reads it is equipped to
understand every other page in the Stripe docs. Without it, the API
reference is confusing.

**5.1 Real example: Stripe-style concept guide**

**Template --- How DevDocs AI indexes your codebase**

> markdown
>
> \# How DevDocs AI indexes your codebase
>
> This page explains the mental model behind DevDocs AI\'s codebase
>
> understanding system. You do not need to read this to use DevDocs AI,
>
> but reading it will help you understand why it produces the results
>
> it does --- and how to get better results from it.
>
> \## The fundamental challenge
>
> A production codebase is too large to fit in any AI model\'s context
>
> window. A typical Next.js application has 50,000--500,000 tokens of
>
> code. Even models with large context windows produce worse output
>
> when given irrelevant code alongside the code they need.
>
> DevDocs AI solves this the same way Cursor and Claude Code do:
>
> it builds a searchable index of your codebase so that, when
>
> generating any piece of documentation, it can retrieve exactly
>
> the right code --- and nothing else.
>
> \## Two types of understanding
>
> DevDocs AI builds two complementary indexes over your codebase.
>
> \*\*Structural understanding\*\* answers precise questions: Where is
>
> the signIn function defined? What files import from auth.ts?
>
> What are all the exported functions in this module? This index is
>
> built by parsing your code into an Abstract Syntax Tree --- a
>
> structured representation of every function, class, import, and
>
> export --- and storing the results in a relational database.
>
> \*\*Semantic understanding\*\* answers fuzzy questions: What code is
>
> relevant to \'authentication\'? What functions handle error states?
>
> This is built by converting chunks of code into vector embeddings ---
>
> numerical representations of meaning --- and storing them in a
>
> vector database that supports similarity search.
>
> When DevDocs AI generates documentation, it combines both:
>
> semantic search finds broadly relevant code, and structural
>
> understanding enriches it with dependencies and type information.
>
> \## What the indexer reads
>
> The indexer processes every file in your repository that matches
>
> these criteria:
>
> \- Not excluded by your .gitignore
>
> \- Not a binary file
>
> \- Not larger than 1 MB
>
> \- In a supported language (TypeScript, JavaScript, Python, Go,
>
> and 40+ others via Tree-sitter grammars)
>
> Files in node_modules, .next, dist, and build directories are
>
> always excluded, regardless of .gitignore settings.
>
> \## How changes are detected
>
> DevDocs AI uses GitHub webhooks to receive push events in real time.
>
> When you push to your tracked branch, GitHub sends a list of
>
> changed files to DevDocs AI. Only those files are re-indexed.
>
> This means documentation stays synchronized with your code without
>
> requiring a full re-index on every change. A typical push event
>
> triggers re-indexing and re-documentation in under 3 minutes.
>
> \## What the indexer does not do
>
> The indexer reads your code but does not execute it. It cannot
>
> understand runtime behavior, dynamic imports resolved at runtime,
>
> or documentation that only emerges from running the system.
>
> It also does not read private environment variables from .env files
>
> --- it reads the variable names from your source code but not their
>
> values from your environment.
>
> \## Related
>
> \- How to configure what gets indexed (.devdocsignore)
>
> \- How the AI generates documentation from indexed code
>
> \- API reference: POST /api/v1/projects/:id/index

**5.2 Anatomy of a concept guide**

  -----------------------------------------------------------------------
  **Element**         **Rule**
  ------------------- ---------------------------------------------------
  Title               A noun phrase, never a verb. \'How X works\',
                      \'What is X\', \'Understanding X\'. Never \'How to
                      X\'.

  Opening             State explicitly what this page does and does not
                      cover. Sets expectations.

  Body                Pure prose --- no bullet points, no numbered steps.
                      Explain relationships between concepts. Use
                      analogies freely.

  Code samples        Illustrative only. Never runnable commands. Show
                      the shape of a thing, not how to use it.

  Related section     Links to the how-to guides and references that let
                      the reader act on what they just learned.

  Length              As long as needed, but ruthlessly cut anything that
                      doesn\'t build the mental model. Stripe\'s are
                      600--1200 words.
  -----------------------------------------------------------------------

**Part 6: What DevDocs AI Generates (Mapped to the Framework)**

This section is the direct bridge between the framework above and what
DevDocs AI actually commits to your /docs folder. Every generated file
maps to exactly one Diátaxis layer.

  ---------------------------------------------------------------------------------
  **Generated file**           **Layer**    **Auto-generated    **Update trigger**
                                            from**              
  ---------------------------- ------------ ------------------- -------------------
  docs/ARCHITECTURE.md         Concept (L1) Dependency graph +  On any structural
                                            module structure    change

  docs/modules/\[name\].md     Concept (L1) Module-level        When module files
                                            chunks + class docs change

  docs/GETTING_STARTED.md      Quickstart   package.json + env  On first index;
                               (L2)         vars + routes       major changes only

  docs/how-to/\[feature\].md   How-to (L3)  Feature-specific    When feature files
                                            code + patterns     change

  docs/api/\[route\].md        Reference    API route           When route file
                               (L4)         handlers + type     changes
                                            annotations         

  docs/ENVIRONMENT.md          Reference    All process.env     When new env vars
                               (L4)         references in       are added
                                            codebase            

  docs/api/openapi.yaml        Reference    All API routes +    On any API route
                               (L4)         Zod schemas         change
  ---------------------------------------------------------------------------------

+-----------------------------------------------------------------------+
| **What DevDocs AI does NOT auto-generate**                            |
|                                                                       |
| Architecture Decision Records (ADRs), post-mortems, design docs, and  |
| RFCs. These are human-authored by nature --- they document reasoning, |
| trade-offs, and decisions, not code. DevDocs AI creates a             |
| docs/decisions/ folder with a template but leaves it empty for humans |
| to fill.                                                              |
+-----------------------------------------------------------------------+

**6.1 The /docs folder structure DevDocs AI commits**

> docs/
>
> ├── README.md ← L1 Concept: project overview + tech stack
>
> ├── ARCHITECTURE.md ← L1 Concept: module map, data flow, key decisions
>
> ├── GETTING_STARTED.md ← L2 Quickstart: new dev running in \< 15 min
>
> ├── ENVIRONMENT.md ← L4 Reference: every env var with type +
> description
>
> │
>
> ├── api/ ← L4 Reference: one file per API route
>
> │ ├── overview.md ← L1 Concept: API design principles + auth
>
> │ ├── openapi.yaml ← L4 Reference: machine-readable OpenAPI 3.0 spec
>
> │ └── \[route-name\].md ← L4 Reference: endpoint docs (Stripe-style)
>
> │
>
> ├── modules/ ← L1 Concept: one file per major feature module
>
> │ └── \[module-name\].md ← Explains what this module is + how it fits
> in
>
> │
>
> ├── how-to/ ← L3 How-to: task-oriented guides
>
> │ └── \[task-name\].md ← \'How to X\' --- generated from common code
> patterns
>
> │
>
> └── decisions/ ← Human-authored ADRs (DevDocs AI creates the folder)
>
> └── adr-template.md ← Template only

**6.2 The ENVIRONMENT.md template (L4 Reference)**

This is a reference document --- exhaustive, factual, no opinions.
DevDocs AI generates this by scanning all process.env references across
the codebase.

> markdown
>
> \# Environment variables
>
> This file is auto-generated from the codebase. Do not edit manually.
>
> Last updated: {{timestamp}} by DevDocs AI.
>
> \## Required
>
> These variables must be set for the application to start.
>
> \| Variable \| Type \| Description \|
>
> \|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| NEXT_PUBLIC_SUPABASE_URL \| URL \| Your Supabase project URL. \|
>
> \| NEXT_PUBLIC_SUPABASE_KEY \| string \| Supabase anon key. Safe to
> expose to the browser. \|
>
> \| SUPABASE_SERVICE_ROLE_KEY \| string \| Supabase service role key.
> Server-side only. \|
>
> \| OPENROUTER_API_KEY \| string \| API key for OpenRouter. Used for AI
> generation. \|
>
> \| GITHUB_CLIENT_ID \| string \| GitHub OAuth app client ID. \|
>
> \| GITHUB_CLIENT_SECRET \| string \| GitHub OAuth app client secret.
> Never expose. \|
>
> \| GITHUB_WEBHOOK_SECRET \| string \| Secret for validating GitHub
> webhook signatures. \|
>
> \## Optional
>
> \| Variable \| Type \| Default \| Description \|
>
> \|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| INNGEST_EVENT_KEY \| string \| --- \| Required only in production.
> \|
>
> \| INNGEST_SIGNING_KEY \| string \| --- \| Required only in
> production. \|
>
> \| MAX_CHUNK_SIZE \| number \| 800 \| Max tokens per code chunk. \|
>
> \| EMBEDDING_MODEL \| string \| text-embedding-3-small \| Override the
> embedding model. \|
>
> \## Where to find these values
>
> \- \*\*Supabase variables\*\*: Project Settings → API in your Supabase
> dashboard
>
> \- \*\*OpenRouter key\*\*: platform.openrouter.ai → Keys
>
> \- \*\*GitHub OAuth credentials\*\*: GitHub → Settings → Developer
> settings → OAuth Apps
>
> \- \*\*GitHub webhook secret\*\*: Generate with: openssl rand -hex 20

**Part 7: The ARCHITECTURE.md --- The Most Important Document**

If you read any single page of a project\'s docs before contributing, it
should be ARCHITECTURE.md. This is how Supabase, Linear, and most
serious open-source projects approach it. It is a **L1 Concept guide**
--- pure explanation of how the system fits together.

**7.1 Full template --- adapted for DevDocs AI**

> markdown
>
> \# Architecture
>
> This document describes the high-level design of DevDocs AI.
>
> It is generated and kept up to date by DevDocs AI itself.
>
> \## System overview
>
> DevDocs AI is a web application that connects to GitHub repositories,
>
> parses their source code, and generates technical documentation using
>
> large language models. The generated documentation is committed back
>
> to the repository as markdown files and kept synchronized with the
>
> codebase on every push.
>
> \## Tech stack
>
> \| Layer \| Technology \| Why \|
>
> \|\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\-\--\|
>
> \| Frontend \| Next.js 15 \| SSR + API routes in one project \|
>
> \| Database \| Supabase/Postgres \| Relational + vector store
> (pgvector) in one \|
>
> \| Auth \| Supabase Auth \| GitHub OAuth built-in \|
>
> \| AI \| OpenRouter API \| Access to Claude, GPT-4, and others \|
>
> \| Background \| Inngest \| Durable queued jobs for indexing \|
>
> \| Hosting \| Vercel \| Zero-config Next.js deployment \|
>
> \| Storage \| Supabase Storage \| Generated file export storage \|
>
> \## Module map
>
> The codebase is organized into four major domains:
>
> \*\*src/lib/cie/\*\* --- Codebase Intelligence Engine
>
> The core of the product. Handles file ingestion, AST parsing, semantic
>
> chunking, embedding, vector storage, and context assembly. This is the
>
> system that \'understands\' connected codebases.
>
> \*\*src/lib/generators/\*\* --- Documentation generators
>
> Takes assembled context from the CIE and calls the LLM to generate
> each
>
> document type. Each generator corresponds to one /docs file type.
>
> \*\*src/lib/github/\*\* --- GitHub integration
>
> OAuth token management, repository file fetching via Octokit, webhook
>
> registration, and file write-back (committing generated docs to
> repos).
>
> \*\*src/app/api/\*\* --- API routes
>
> Next.js API routes that expose the above modules to the frontend and
> to
>
> GitHub\'s webhook system.
>
> \## Data flow: initial indexing
>
> 1\. User connects a GitHub repo via OAuth
>
> 2\. POST /api/index-repo triggers an Inngest job
>
> 3\. Inngest job: fetch all files via Octokit → parse ASTs → chunk →
>
> embed in batches → upsert into Supabase pgvector
>
> 4\. Index status updated to \'indexed\' in projects table
>
> 5\. Documentation generation job is triggered automatically
>
> \## Data flow: push event sync
>
> 1\. Developer pushes to tracked branch on GitHub
>
> 2\. GitHub sends push event to POST /api/webhook/github
>
> 3\. Webhook handler validates HMAC signature, queues Inngest job
>
> 4\. Inngest job: extract changed files from push payload →
>
> delete stale chunks → re-index changed files only
>
> 5\. Documentation regeneration runs for affected modules
>
> 6\. Updated docs committed back to /docs via GitHub API
>
> \## Key design decisions
>
> \*\*Why Supabase for vectors?\*\*
>
> Using pgvector inside Supabase means one database for relational data
>
> and vector search. This simplifies the stack significantly compared to
>
> running a separate Pinecone or Weaviate instance.
>
> \*\*Why Inngest for background jobs?\*\*
>
> Indexing a large codebase can take several minutes and must survive
>
> server restarts. Inngest provides durable execution with retries and
>
> checkpointing without running a separate worker process.
>
> \*\*Why OpenRouter instead of calling Claude/GPT-4 directly?\*\*
>
> OpenRouter provides a unified API across multiple model providers.
>
> This means we can switch models or use fallbacks without code changes.
>
> \## What to read next
>
> \- \[The Codebase Intelligence Engine in
> depth\](./modules/codebase-intelligence-engine.md)
>
> \- \[How documentation generation works\](./modules/doc-generators.md)
>
> \- \[Getting started as a contributor\](./GETTING_STARTED.md)

**Part 8: External Documentation Sites --- Structure Reference**

DevDocs AI commits markdown to GitHub. But big companies also serve
documentation on external sites with navigation, search, and versioning.
This section documents how those sites are structured so you can
replicate the pattern.

**8.1 Stripe docs structure (gold standard)**

  -----------------------------------------------------------------------
  **Section**           **Content type**
  --------------------- -------------------------------------------------
  Docs home             L2 Quickstart cards --- \'Accept a payment\',
                        \'Set up subscriptions\'. First click always gets
                        you working.

  Guides                L1 Concept guides --- \'How payments work\',
                        \'Radar fraud detection\'. No commands.

  Payments (left nav)   L3 How-to guides organized by goal --- \'Save
                        payment details\', \'Send a payment link\'.

  API reference         L4 Reference --- single-page app. Every object,
                        every method, every param. Language selector
                        (curl/Python/Node/etc.).

  Testing               L3 How-to --- \'Test a payment flow\'. Dedicated
                        section because testing is the #1 friction point.

  Changelog             Sequential list of API changes. Every breaking
                        change in bold. Links to migration guides.
  -----------------------------------------------------------------------

**8.2 Vercel docs structure**

  -----------------------------------------------------------------------
  **Section**           **Content type**
  --------------------- -------------------------------------------------
  Getting started       L2 Quickstart --- deploy in 5 minutes.
                        Framework-specific (Next.js, Nuxt, SvelteKit
                        tabs).

  Frameworks            L1 Concept per framework --- what Vercel does
                        differently for each one.

  Projects &            L3 How-to guides grouped by task.
  deployments           

  Functions             Mixed: L1 concept overview + L3 how-to guides +
                        L4 reference for config options.

  CLI reference         L4 Reference --- every command, every flag.

  Error codes           L4 Reference --- every error with a specific fix.
                        Heavily SEO-optimized for error message searches.
  -----------------------------------------------------------------------

**8.3 The navigation principle shared by all of them**

+-----------------------------------------------------------------------+
| **Universal pattern**                                                 |
|                                                                       |
| Every great docs site has the same left navigation structure: (1) a   |
| quickstart at the very top, (2) concept guides grouped below, (3)     |
| how-to guides organized by user goal, (4) API reference at the        |
| bottom. The order matches the user\'s journey from \'what is this\'   |
| to \'how do I build with this\' to \'what exactly does this parameter |
| do\'.                                                                 |
+-----------------------------------------------------------------------+

**Part 9: What Separates Great Docs from Mediocre Ones**

This is a direct comparison table. Every item has been observed in real
production documentation from both categories.

  -----------------------------------------------------------------------
  **Great docs do this (Stripe,       **Mediocre docs do this**
  Vercel)**                           
  ----------------------------------- -----------------------------------
  Every code example is complete and  Code examples omit imports, assume
  runnable as written                 variables that weren\'t defined,
                                      use \... placeholders

  Error messages are documented with  Error handling is not mentioned;
  specific fixes, not \'contact       users figure it out on Stack
  support\'                           Overflow

  Environment variable names match    Docs say DATABASE_URL but the code
  exactly what the code uses          reads DB_CONNECTION_STRING

  Every page has a \'last updated\'   No indication of whether the docs
  date                                apply to the current version

  Breaking changes get their own      A changelog entry says \'signIn()
  migration guide                     renamed to authenticate()\' with no
                                      migration path

  The \'Related\' section links to    No links. Dead ends everywhere.
  the next logical thing to read      

  Copy button on every code block     Users manually select and copy
                                      code, introducing selection errors

  Language tabs on code blocks (Node, All examples in one language.
  Python, curl)                       Non-users of that language are
                                      stranded.
  -----------------------------------------------------------------------

**Part 10: Architecture Decision Records --- The Human Layer**

ADRs are the one documentation type that AI cannot generate, because
they document reasoning and alternatives considered --- things that
exist only in the minds of the people who made the decision, not in the
code.

GitHub, Airbnb, and most serious engineering orgs write an ADR for every
significant architecture decision. DevDocs AI creates the folder and the
template; humans fill it in.

**10.1 ADR template (used by GitHub, Airbnb, Spotify)**

> markdown
>
> \# ADR-001: Use Supabase pgvector instead of a dedicated vector
> database
>
> \*\*Status:\*\* Accepted
>
> \*\*Date:\*\* 2026-03-12
>
> \*\*Author:\*\* Solomon Njogo
>
> \*\*Reviewers:\*\* Fredrick Ogore
>
> \## Context
>
> DevDocs AI needs to store and search over vector embeddings of code
> chunks.
>
> This is required for the semantic search that powers documentation
> generation.
>
> We evaluated three approaches.
>
> \## Decision
>
> We will use Supabase\'s pgvector extension rather than a dedicated
> vector
>
> database (Pinecone, Weaviate, or Qdrant).
>
> \## Options considered
>
> \*\*Option A: Pinecone (rejected)\*\*
>
> Pros: Managed, very fast ANN search, good SDKs.
>
> Cons: Separate service to manage, separate billing, data lives outside
>
> Supabase meaning we lose the ability to join vectors with relational
> data.
>
> Cost: \~\$70/month at our projected scale.
>
> \*\*Option B: Supabase pgvector (chosen)\*\*
>
> Pros: Zero additional infrastructure, vectors live in the same
> Postgres
>
> instance as all other data, can join with relational tables, free on
>
> Supabase Pro tier up to \~1M vectors.
>
> Cons: Slower than purpose-built vector DBs at very large scales (10M+
>
> vectors). Not a concern at our current scope.
>
> \*\*Option C: Local FAISS (rejected)\*\*
>
> Pros: Free, fastest for small datasets.
>
> Cons: Does not persist across server restarts on Vercel serverless.
>
> Fundamentally incompatible with our deployment model.
>
> \## Consequences
>
> \*\*Positive:\*\*
>
> \- Simplified stack: one database service instead of two
>
> \- Relational queries can include vector similarity scores
>
> \- No cross-service data synchronization required
>
> \*\*Negative:\*\*
>
> \- If the project grows beyond \~5M code chunks, we may need to
> migrate
>
> to a dedicated vector DB. This is not expected within 18 months.
>
> \- pgvector\'s HNSW index requires tuning (m, ef_construction params)
>
> to balance search quality vs index build time.
>
> \## Revisit conditions
>
> Revisit this decision if:
>
> \- p95 vector search latency exceeds 200ms under normal load
>
> \- Total chunk count approaches 2M vectors

**10.2 When to write an ADR**

-   Any time you choose between two or more technical approaches

-   Any time you accept a significant trade-off (e.g. speed vs
    simplicity)

-   Any time you reject a pattern that seems obvious (so future
    developers don\'t re-litigate it)

-   Any time you choose a third-party service over building in-house

-   Mergers, refactors, or rewrites of major modules

**References**

-   Procida, D. (2021). Diátaxis: A systematic approach to technical
    documentation authoring. https://diataxis.fr

-   Stripe, Inc. (2024). Stripe Documentation. https://stripe.com/docs
    --- Referenced as exemplar for API reference and concept guide
    structure.

-   Vercel, Inc. (2024). Vercel Documentation. https://vercel.com/docs
    --- Referenced for quickstart and how-to guide structure.

-   Supabase, Inc. (2024). Supabase Documentation.
    https://supabase.com/docs --- Referenced for tutorial structure and
    Edge Function documentation.

-   GitHub, Inc. (2024). GitHub Docs. https://docs.github.com ---
    Referenced for how-to guide and REST API reference structure.

-   Nygard, M. T. (2011). Documenting Architecture Decisions.
    https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions
    --- Original ADR format.

-   Divio GmbH. (2023). The Documentation System.
    https://documentation.divio.com --- Earlier formulation of the
    four-quadrant framework.
