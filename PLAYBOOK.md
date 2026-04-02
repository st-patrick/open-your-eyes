# Open Your Eyes — Agent Playbook

> Drop this file into any project. An AI agent will scan the codebase, figure out every service it needs to go live, and walk you through the absolute minimum you need to do: approve, log in, and pay. Everything else — the research, the wiring, the configuration, the deployment — is the agent's job.

---

## PRIME DIRECTIVE

```
THE HUMAN DOES THREE THINGS:
  1. APPROVE  — confirm what the agent is about to do
  2. LOG IN   — authenticate on dashboards the agent can't access
  3. PAY      — enter payment details where required

EVERYTHING ELSE IS THE AGENT'S JOB.

The agent figures out what's needed. The agent researches the APIs.
The agent writes the config. The agent deploys. The agent validates.
The agent troubleshoots. The human just says "yes" and pastes keys.
```

This means:
- Don't ask the user "what framework should we use?" — read the code.
- Don't ask "do you need a database?" — check the dependencies.
- Don't explain what an API key is — just say "go to this URL, click this button, paste what you see."
- Don't give the user homework — if something can be done via API, the agent does it.
- Minimize questions. Maximize automation. Every question you ask the user is a failure to figure it out yourself.

---

## RULE: NEVER TRUST YOUR TRAINING DATA FOR API SPECS

```
YOUR KNOWLEDGE OF APIs IS STALE. ALWAYS LOOK UP THE LATEST DOCS.

Before guiding a user through ANY service's credential setup:
  1. Fetch the provider's current API documentation
  2. Fetch their current "getting started" or "authentication" page
  3. Verify that the URLs, dashboard paths, and steps you're about to
     give are CURRENT — not what you remember from training

Before writing ANY validation call:
  1. Look up the current API endpoint and auth format
  2. Check for recent API version changes (v1 → v2, REST → GraphQL, etc.)
  3. Verify the response format hasn't changed

DO NOT wing it. DO NOT rely on memory. FETCH THE DOCS EVERY TIME.
```

Why this matters:
- Stripe moved their API keys page. Your training data has the old URL.
- Supabase changed their Management API auth flow. Your training data has the old one.
- Vercel deprecated an endpoint. Your validation script returns 404.
- A provider you've never heard of (lima-city, Uberspace, All-Inkl) has perfectly good APIs — but only if you actually go read their docs.

### How to Research a Provider

```
For EVERY provider, even ones you think you know:

1. SEARCH: "[provider] API documentation [current year]"
2. FETCH: Read their official docs — specifically:
   a. Authentication page (how to create tokens/keys)
   b. API reference (endpoints, auth headers, response format)
   c. Rate limits and free tier restrictions
   d. Changelog or migration guide (what changed recently?)
3. VERIFY: Cross-check at least 2 sources when possible
   (official docs + developer blog/changelog)
4. BUILD: Construct the guide from LIVE information, not memory

If you can't access the docs (blocked, down, paywalled):
  → Tell the user: "I can't access [provider]'s docs right now.
    Can you check [URL] and tell me how to create an API key?"
  → Even then, don't guess — ask the user to describe what they see.
```

---

## 1. Project Scan

When this playbook is present in a project, the agent scans the codebase **automatically** before saying a word to the user.

### Step 1: Detect Project Type

Scan for these markers:

```
Web App (SPA/SSR):
  → package.json with react, vue, svelte, angular, next, nuxt, sveltekit, astro
  → vite.config.*, next.config.*, nuxt.config.*

Static Site:
  → index.html at root, no framework deps
  → hugo.toml, _config.yml (Jekyll), mkdocs.yml

Mobile App (iOS):
  → *.xcodeproj, *.xcworkspace, Podfile, Package.swift
  → ios/ directory with Info.plist

Mobile App (Android):
  → build.gradle, settings.gradle, AndroidManifest.xml
  → android/ directory

Cross-Platform Mobile:
  → capacitor.config.*, ionic.config.json
  → app.json with "expo" key (React Native/Expo)
  → pubspec.yaml (Flutter)
  → .csproj with Xamarin/MAUI references

Desktop App:
  → electron-builder.yml, electron.vite.config.*
  → tauri.conf.json
  → Package.swift with .macOS platform

API / Backend:
  → main.go, cmd/ (Go) | manage.py, wsgi.py (Django)
  → Gemfile with rails | server.ts/server.js with express/fastify/hono
  → Cargo.toml (Rust)

Monorepo:
  → pnpm-workspace.yaml, lerna.json, nx.json, turbo.json
  → apps/ or packages/ (scan each sub-project recursively)

Containerized:
  → Dockerfile, docker-compose.yml, compose.yaml

Serverless:
  → serverless.yml, sam-template.yaml, wrangler.toml
  → supabase/functions/, netlify/functions/, vercel.json with functions
```

### Step 2: Detect Services & Dependencies

Scan dependency files and source code for service integrations:

```
Package managers to scan:
  → package.json, requirements.txt, Pipfile, Gemfile, go.mod,
    Cargo.toml, pubspec.yaml, Podfile, build.gradle, *.csproj

Source code patterns:
  → import/require statements, SDK initializations,
    env var references (process.env.*, os.environ, etc.)

---

HOSTING / DEPLOY:
  vercel.json, .vercel/                          → Vercel
  netlify.toml, _redirects                       → Netlify
  wrangler.toml                                  → Cloudflare Workers/Pages
  fly.toml                                       → Fly.io
  app.yaml (with "runtime:")                     → Google App Engine
  Procfile                                       → Heroku
  render.yaml                                    → Render
  railway.json, railway.toml                     → Railway
  .platform.app.yaml                             → Platform.sh
  Dockerfile (alone, no other deploy config)     → needs container registry + host
  .htaccess, .php files                          → traditional webhost (Apache)
  nginx.conf                                     → traditional webhost (nginx)

DNS / DOMAINS:
  (Rarely in code — ask the user)

DATABASE:
  @supabase/supabase-js, supabase-py             → Supabase
  @prisma/client + DATABASE_URL                  → check connection string for provider
  pg, postgres, psycopg2                         → PostgreSQL (where?)
  mysql2, mysqlclient                            → MySQL (where?)
  mongoose, mongodb                              → MongoDB (Atlas? self-hosted?)
  @planetscale/database                          → PlanetScale
  @neondatabase/serverless                       → Neon
  @libsql/client, @turso                         → Turso
  firebase-admin, firebase/firestore             → Firebase/Firestore
  drizzle-orm, typeorm, sequelize, knex          → check their config for connection target
  better-sqlite3, sqlite3                        → SQLite (local, no credentials needed)

AUTH:
  @supabase/auth-helpers, @supabase/ssr          → Supabase Auth
  next-auth, @auth/core                          → NextAuth (check providers config)
  firebase/auth                                  → Firebase Auth
  @clerk/*, @clerk                               → Clerk
  auth0, @auth0/*                                → Auth0
  passport, passport-*                           → Passport.js (check strategies)
  @kinde-oss/*                                   → Kinde
  lucia, @lucia-auth/*                           → Lucia (self-hosted, check adapter)

PAYMENTS:
  @stripe/stripe-js, stripe                      → Stripe
  @paypal/checkout-server-sdk                    → PayPal
  @mollie/api-client                             → Mollie
  @lemonsqueezy/lemonsqueezy.js                  → LemonSqueezy
  paddle-sdk, @paddle/*                          → Paddle
  razorpay                                       → Razorpay

EMAIL:
  resend                                         → Resend
  @sendgrid/mail                                 → SendGrid
  postmark, postmark.js                          → Postmark
  nodemailer                                     → SMTP (check config for provider)
  @aws-sdk/client-ses                            → AWS SES
  mailgun.js, mailgun-js                         → Mailgun

STORAGE / FILE UPLOADS:
  @supabase/storage-js                           → Supabase Storage
  @aws-sdk/client-s3, aws-sdk (S3)              → AWS S3 (or compatible: R2, MinIO)
  @google-cloud/storage                          → Google Cloud Storage
  @azure/storage-blob                            → Azure Blob Storage
  firebase/storage                               → Firebase Storage
  cloudinary                                     → Cloudinary
  uploadthing, @uploadthing/*                    → UploadThing

ANALYTICS:
  posthog-js, posthog-node                       → PostHog
  plausible-tracker                              → Plausible
  @vercel/analytics                              → Vercel Analytics
  mixpanel, mixpanel-browser                     → Mixpanel
  @segment/analytics-next                        → Segment
  firebase/analytics                             → Google Analytics (via Firebase)

ERROR MONITORING:
  @sentry/*, sentry-sdk                          → Sentry
  @highlight-run/*                               → Highlight
  logrocket                                      → LogRocket
  @datadog/browser-rum                           → Datadog
  bugsnag, @bugsnag/*                            → Bugsnag

PUSH NOTIFICATIONS:
  firebase/messaging                             → Firebase Cloud Messaging
  @onesignal/*                                   → OneSignal
  web-push                                       → Web Push (needs VAPID keys)
  expo-notifications                             → Expo Push

CMS / CONTENT:
  @sanity/client                                 → Sanity
  contentful                                     → Contentful
  @strapi/*                                      → Strapi
  @keystonejs/*                                  → Keystone

SEARCH:
  algoliasearch                                  → Algolia
  meilisearch                                    → Meilisearch
  typesense                                      → Typesense

AI / ML:
  openai                                         → OpenAI
  @anthropic-ai/sdk                              → Anthropic
  @google/generative-ai                          → Google AI
  replicate                                      → Replicate
  @huggingface/*                                 → Hugging Face

CI/CD:
  .github/workflows/                             → GitHub Actions
  .gitlab-ci.yml                                 → GitLab CI
  .circleci/                                     → CircleCI
  bitbucket-pipelines.yml                        → Bitbucket Pipelines

MOBILE-SPECIFIC:
  *.xcodeproj + exportOptions.plist              → Apple Developer (signing)
  google-services.json                           → Firebase (Android)
  GoogleService-Info.plist                       → Firebase (iOS)
  fastlane/                                      → Fastlane (needs store credentials)
  eas.json                                       → Expo Application Services
  android/app/build.gradle with signingConfigs   → Android Keystore
```

### Step 3: Detect Existing Configuration

```
Check in this order:

1. ~/.open-your-eyes/secrets.env          ← our credential store
2. .env, .env.local, .env.development     ← project-level env files
3. Environment variables in shell          ← already exported
4. Config files with credential fields     ← e.g., supabase/config.toml
5. CI/CD secrets                           ← .github/workflows (reference names only)
6. vercel.json / netlify.toml env sections ← deploy-time env vars

DO NOT read or log actual values from .env files — just note which keys exist.
For ~/.open-your-eyes/secrets.env, validate that stored keys still work.
```

### Step 4: Scan for Unreferenced Env Vars

Grep source code for `process.env.SOMETHING`, `os.environ["SOMETHING"]`, `env("SOMETHING")`, `import.meta.env.SOMETHING`, etc. Cross-reference with what exists. Any env var referenced in code but undefined anywhere is a credential gap.

### Step 5: Build the Requirements Matrix

```
EXAMPLE OUTPUT:

Project Type: Next.js web app with Supabase + Stripe
Deploy Target: Vercel (vercel.json found)

┌─────────────┬──────────────┬─────────────────┬──────────────┐
│ Role        │ Provider     │ Detected Via    │ Credentials  │
├─────────────┼──────────────┼─────────────────┼──────────────┤
│ Hosting     │ Vercel       │ vercel.json     │ ✗ MISSING    │
│ DNS         │ ???          │ (not in code)   │ ✗ ASK USER   │
│ Database    │ Supabase     │ package.json    │ ✓ in .env    │
│ Auth        │ Supabase     │ @supabase/ssr   │ ✓ in .env    │
│ Payments    │ Stripe       │ stripe in deps  │ ✗ MISSING    │
│ Email       │ Resend       │ resend in deps  │ ✗ MISSING    │
│ Analytics   │ PostHog      │ posthog-js      │ ✓ in .env    │
│ Errors      │ —            │ not detected    │ — SKIP       │
└─────────────┴──────────────┴─────────────────┴──────────────┘

ACTIONS (in order — minimize human interruptions):
 1. [AGENT]  Validate existing Supabase + PostHog keys still work
 2. [HUMAN]  Paste Vercel API token (I'll show you exactly where to get it)
 3. [HUMAN]  Tell me where DNS is managed for your domain
 4. [HUMAN]  Paste Stripe keys (I'll show you exactly where)
 5. [HUMAN]  Paste Resend API key (I'll show you exactly where)
 6. [AGENT]  Validate all new keys
 7. [AGENT]  Run end-to-end deploy test
```

---

## 2. The Conversation

### Present the Scan — Don't Interrogate

Show the matrix. Be direct about what you need:

> I've scanned your project. It's a Next.js app using Supabase, Stripe, and Resend.
>
> Supabase and PostHog keys are already configured — I'm validating them now.
>
> I need 3 things from you:
> 1. A Vercel API token — go to [URL], I'll tell you exactly what to click
> 2. Your Stripe keys — go to [URL]
> 3. A Resend API key — go to [URL]
>
> Also: where do you manage DNS for your domain? (I need this to point your domain at the deployment.)

### Batch Human Actions

Don't make the user do one thing at a time. Give them all the URLs upfront:

> While I validate your existing keys, you can get the new ones in parallel. Open these 3 tabs:
> 1. [Vercel tokens page — LIVE URL fetched from docs]
> 2. [Stripe API keys page — LIVE URL fetched from docs]
> 3. [Resend API keys page — LIVE URL fetched from docs]
>
> For each one: create a new key, copy it, paste it back here. I'll validate each one as you give it to me.

### For Each Credential the User Needs to Create

The agent should:

1. **Fetch the provider's current docs** (RULE: never trust training data)
2. **Give the exact current URL** to the credentials page
3. **Give the minimum steps**: "click X, name it Y, select Z scope, copy the result"
4. **Explain what it grants** in one sentence: "This lets me deploy code to your Vercel account"
5. **Collect it**: "Paste it here"
6. **Validate immediately**: make a real API call, report success or diagnose failure
7. **Store it**: write to `~/.open-your-eyes/secrets.env`

What the agent does NOT do:
- Explain what an API is
- Give a history of the provider
- List features the user didn't ask about
- Offer alternatives when the provider is already chosen by the code

### Questions Only for What Code Can't Tell You

- **DNS provider** — "Where do you manage DNS for `yourdomain.com`?"
- **Existing accounts** — "Do you already have a [detected provider] account, or should I walk you through creating one?"
- **Which account** — if multiple projects/orgs are possible: "Which Supabase project is this app connected to?"

### When the User Names a Provider You Don't Know

This will happen. The user says "I use lima-city" or "my hosting is at All-Inkl" or "we use Mollie for payments." Your training data probably has nothing useful.

```
1. DO NOT pretend you know their API
2. DO search for their docs RIGHT NOW
3. DO read their API/developer documentation
4. DO figure out: auth method, key creation URL, validation endpoint
5. DO build a step-by-step guide from LIVE docs
6. If the provider has no API: say so, discuss workarounds (SSH, FTP, polyfill)
```

---

## 3. Platform-Specific Requirements

### Mobile Apps (iOS)

If `*.xcodeproj` or `ios/` detected:

```
REQUIRED:
├── Apple Developer Account ($99/year)
│   ├── Team ID
│   ├── App Store Connect API Key (.p8 file + Key ID + Issuer ID)
│   ├── Signing Certificate (distribution)
│   └── Provisioning Profile
│
├── If using Fastlane:
│   ├── MATCH_PASSWORD (cert encryption)
│   ├── MATCH_GIT_URL (cert storage repo)
│   └── APP_STORE_CONNECT_API_KEY_PATH
│
├── If using Expo EAS:
│   ├── EXPO_TOKEN
│   └── Apple credentials (EAS manages interactively)
│
└── If push notifications:
    └── APNs key (.p8) — often same as App Store Connect key

AGENT DOES: Generate provisioning profiles, manage signing, submit builds
HUMAN DOES: Log into Apple Developer portal, approve account creation, pay $99/year
```

### Mobile Apps (Android)

If `android/` or `build.gradle` detected:

```
REQUIRED:
├── Google Play Console ($25 one-time)
│   ├── Service Account JSON key
│   └── Upload Keystore (.jks or .keystore)
│       ├── ANDROID_KEYSTORE_PATH
│       ├── ANDROID_KEYSTORE_PASSWORD
│       ├── ANDROID_KEY_ALIAS
│       └── ANDROID_KEY_PASSWORD
│
├── If using Fastlane:
│   └── SUPPLY_JSON_KEY (path to service account JSON)
│
└── If using Expo EAS:
    └── EXPO_TOKEN + Google Service Account JSON

AGENT DOES: Generate keystores, configure signing, submit builds, manage listings
HUMAN DOES: Log into Google Play Console, approve developer registration, pay $25
```

### Desktop Apps (Electron / Tauri)

```
REQUIRED:
├── Code Signing:
│   ├── macOS: Apple Developer ID cert + notarization credentials
│   ├── Windows: Code signing certificate (.pfx)
│   └── Linux: GPG key (optional)
│
├── Auto-Update:
│   └── GitHub token (for releases) or S3 bucket
│
└── Distribution:
    ├── Mac App Store → Apple Developer account
    ├── Microsoft Store → Microsoft Partner Center
    └── Snap Store → snapcraft token

AGENT DOES: Configure signing, build installers, publish releases, set up auto-update
HUMAN DOES: Purchase certificates, log into store accounts
```

### Browser Extensions

If `manifest.json` with `"manifest_version"` detected:

```
REQUIRED:
├── Chrome Web Store: OAuth2 credentials ($5 one-time)
├── Firefox Add-ons: JWT credentials (free)
└── Edge Add-ons: Microsoft Partner Center

AGENT DOES: Package extension, upload builds, manage listings
HUMAN DOES: Register developer accounts, pay one-time fees
```

### CLI Tools / Libraries (Publishing)

```
REQUIRED per registry:
├── npm: NPM_TOKEN
├── PyPI: PYPI_API_TOKEN
├── crates.io: CARGO_REGISTRY_TOKEN
├── RubyGems: GEM_HOST_API_KEY
└── Go: (no token needed)

AGENT DOES: Build, test, version, publish
HUMAN DOES: Create registry account, generate token
```

### Containerized Apps

```
REQUIRED:
├── Container Registry (Docker Hub, GHCR, ECR, GCR, self-hosted)
└── Container Host (Fly, Railway, Cloud Run, ECS, VPS, K8s)

AGENT DOES: Build images, push to registry, deploy, manage scaling
HUMAN DOES: Create accounts, paste credentials
```

---

## 4. Gap Analysis & Polyfill

After scan + credential collection, identify what's missing for the project to actually go live.

### The Agent Thinks in User Flows

Don't think in services — think in what the end user of the app does:

```
"A user visits the site"
  → Need: hosting + DNS + domain + SSL
  → Is all of this wired up?

"A user signs up"
  → Need: auth provider + email (for verification)
  → Auth is configured but no email? That's a broken flow.

"A user makes a purchase"
  → Need: payment provider + webhooks + database (to record it)
  → Stripe key exists but no webhook secret? Payments will seem to work but won't be recorded.

"A user uploads a file"
  → Need: storage provider
  → Storage SDK imported but no bucket configured?

"The developer pushes code"
  → Need: CI/CD or deploy pipeline
  → Code is ready but no deploy mechanism? That's the last mile.
```

Report gaps as broken flows, not missing services:

> Your app has user registration, but no email provider configured. Users won't receive verification emails, so signups will silently fail. Want to set up email sending?

### Polyfill Rules

1. **Never replace** — if the user's provider works, use it
2. **Only polyfill gaps** — suggest new services only when a user flow is broken
3. **Cloudflare as DNS polyfill** — the one case where it's always appropriate: user's registrar has no DNS API → point nameservers to Cloudflare (free)
4. **SSH/FTP as deploy fallback** — host has no deploy API but has SSH? Deploy via rsync.
5. **SMTP as email fallback** — no email API but host includes SMTP? Use SMTP.

---

## 5. Credential Collection Protocol

For each credential the agent needs:

### The Agent's Checklist (internal, don't show to user)

```
□ 1. RESEARCH: Fetch this provider's CURRENT docs
      Search: "[provider] API documentation"
      Search: "[provider] create API key"
      Search: "[provider] developer portal"
      Read: their auth/authentication page
      Read: their API reference (at least the auth section)
      Note: auth method, token format, required scopes

□ 2. FIND: The exact current URL where the user creates credentials
      DO NOT use a URL from training data
      DO verify the URL loads and goes where expected
      If the URL has changed, find the new one

□ 3. GUIDE: Write the minimum steps
      "Go to [URL]. Click [button]. Name it [suggestion]. Copy the result."
      No preamble. No history. No explanations they didn't ask for.

□ 4. COLLECT: Ask for the credential
      "Paste your [provider] API key here."
      One credential at a time, or batch if the user is fast.

□ 5. VALIDATE: Make a real API call
      Use the CURRENT endpoint from the docs you just fetched
      Hit a read-only endpoint (list projects, get account info)
      Report: "✓ Connected to [account name]" or diagnose failure

□ 6. STORE: Write to ~/.open-your-eyes/secrets.env
      Variable name: [PROVIDER]_[CREDENTIAL_TYPE]
      Include [ROLE]_PROVIDER=[provider] tag

□ 7. CONFIRM: Tell the user what this unlocks
      "✓ I can now deploy to your Vercel account."
      One sentence. Move on.
```

### When Validation Fails

The agent's job is to diagnose, not punt back to the user:

```
401 Unauthorized:
  → Key is wrong, expired, or has wrong permissions
  → Check: was it copied with extra whitespace?
  → Check: is it the right type of key? (API key vs OAuth token vs...)
  → Guide: "That key didn't work. The most common reason is [X].
    Try [specific fix]. If that doesn't work, create a new key at [URL]."

403 Forbidden:
  → Key works but lacks permissions
  → Guide: "Your key doesn't have permission to [action]. Go to [URL]
    and make sure [specific permission] is enabled."

404 Not Found:
  → Endpoint may have changed (this is why you fetch live docs!)
  → Re-check the current API docs
  → If the endpoint moved, update your validation call

Connection refused / timeout:
  → Service might be down, or URL is wrong
  → Check the provider's status page
```

---

## 6. Credential Storage

### Location
```
~/.open-your-eyes/
├── secrets.env           # All credentials — chmod 600, never committed
├── config.yaml           # Non-secret config (preferences, regions)
└── validation-log.json   # Last validation result per service
```

### Setup (run once, idempotent)
```bash
mkdir -p ~/.open-your-eyes
touch ~/.open-your-eyes/secrets.env
chmod 600 ~/.open-your-eyes/secrets.env
grep -qxF '.open-your-eyes/' ~/.gitignore_global 2>/dev/null || echo ".open-your-eyes/" >> ~/.gitignore_global
git config --global core.excludesFile ~/.gitignore_global
```

### secrets.env Format
```bash
# Pattern: [ROLE]_PROVIDER=[name] then [PROVIDER]_[CREDENTIAL_TYPE]=[value]

# ===== DEPLOY =====
DEPLOY_PROVIDER=vercel
VERCEL_TOKEN=xxx

# ===== DNS =====
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx

# ===== DOMAIN =====
DOMAIN=yourdomain.com
DOMAIN_REGISTRAR=porkbun
PORKBUN_API_KEY=xxx
PORKBUN_SECRET_KEY=xxx

# ===== DATABASE =====
DB_PROVIDER=supabase
SUPABASE_URL=xxx
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# ===== PAYMENTS =====
PAYMENTS_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=xxx
STRIPE_SECRET_KEY=xxx

# ===== EMAIL =====
EMAIL_PROVIDER=smtp
SMTP_HOST=xxx
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx

# ===== MOBILE (iOS) =====
APPLE_TEAM_ID=xxx
APPLE_API_KEY_ID=xxx
APPLE_API_ISSUER_ID=xxx
APPLE_API_KEY_PATH=~/.open-your-eyes/keys/AuthKey_XXXXX.p8

# ===== MOBILE (Android) =====
GOOGLE_PLAY_JSON_KEY_PATH=~/.open-your-eyes/keys/google-play.json
ANDROID_KEYSTORE_PATH=xxx
ANDROID_KEYSTORE_PASSWORD=xxx
ANDROID_KEY_ALIAS=xxx
ANDROID_KEY_PASSWORD=xxx
```

---

## 7. Validation Gates

Prove the pipeline works. Don't validate services in isolation — validate **user flows**.

### Gate Selection (based on project type)

| Project Type | Gate |
|-------------|------|
| Any web project | Deploy a test page to the host |
| Web + custom domain | Point domain at deployment, confirm HTTPS |
| Web + database | Create table, write row, read it back, clean up |
| Web + payments | Create test product, clean up |
| Web + email | Send test email to user |
| Mobile (iOS) | Validate signing, connect to App Store Connect |
| Mobile (Android) | Validate keystore, connect to Google Play |
| Desktop | Code-sign a test binary |
| Container | Push test image to registry |

### Gate Protocol

```
1. Tell the user what you're about to do (one sentence)
2. Ask: "OK to proceed?" (this is the APPROVE step)
3. Do it
4. Report result
5. Clean up test resources
6. Move on — don't celebrate, don't recap
```

---

## 8. After Setup: What the Agent Can Now Do

Once credentials are collected and validated, the agent should confirm what's unlocked:

```
EXAMPLE:

✓ Setup complete. Here's what I can do for you now:

  Deploy code to your Vercel account         → say "deploy" or "ship it"
  Point your domain at any deployment        → automatic after deploy
  Create and manage database tables          → just describe your data model
  Set up user auth and registration          → just describe who can do what
  Process payments via Stripe (test mode)    → describe your pricing
  Send emails from your app                  → describe when to send what

  You approve. I do the rest.
```

---

## 9. Re-entry Points

The playbook isn't one-time. The agent re-enters it when:

- **Missing credential at runtime** — tried to deploy, no token → run deploy credential section
- **Expired credential** — API returns 401 → guide rotation
- **New dependency added** — user installed a new SDK → re-scan, detect new requirements
- **New project** — playbook dropped into different project → full scan, reuse existing global creds
- **User asks** — "add payments to this app" → run payments section
- **Stale validation** — >30 days since last check → re-validate all stored credentials

---

## 10. How to Use This Playbook

**Drop it into any project.** Tell your AI agent:

> "Set me up."

The agent scans your code, figures out what's needed, fetches the latest docs for every service, and tells you exactly what to click. You approve, log in, paste keys. The agent handles everything else.

---

## Appendix: The Dependency Map Is a Starting Point

The package-to-service mappings in Section 1 are not exhaustive. New services appear constantly. If the agent encounters an import or SDK it doesn't recognize:

1. Search for it: `"[package name] npm"` or `"[package name] documentation"`
2. Determine what service it belongs to
3. Add it to the mental model for this project
4. Follow the standard credential collection protocol

The map is a cheat sheet, not a limit. The agent should be able to handle anything it finds in the code.
