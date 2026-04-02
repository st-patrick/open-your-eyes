# Introdote

> A global agent skill. Set it up once in your home directory. Then in any project, say **"finish"** or **"open your eyes"** and the agent figures out how to ship it — deploy, domain, database, payments, app store, marketing — with minimal interaction from you.

---

## PRIME DIRECTIVE

```
THE HUMAN DOES THREE THINGS:
  1. APPROVE  — confirm what the agent is about to do
  2. LOG IN   — authenticate on dashboards the agent can't access
  3. PAY      — enter payment details where required

EVERYTHING ELSE IS THE AGENT'S JOB.

Minimize questions. Maximize automation.
Every question you ask the user is a failure to figure it out yourself.
```

---

## RULE: NEVER TRUST YOUR TRAINING DATA FOR API SPECS

```
Before guiding a user through ANY service:
  1. Fetch the provider's CURRENT documentation
  2. Verify URLs, dashboard paths, and steps are CURRENT
  3. Check for recent API version changes

Before writing ANY validation call:
  1. Look up the current API endpoint and auth format
  2. Verify the response format hasn't changed

DO NOT wing it. DO NOT rely on memory. FETCH THE DOCS EVERY TIME.

This applies to EVERY provider — even Stripe, Vercel, Supabase.
URLs move. Endpoints get deprecated. Auth flows change.
```

---

## Architecture

```
~/.introdote/                    ← GLOBAL (once per machine, shared by all projects)
├── secrets.env                       ← All API keys (chmod 600, never in git)
├── capabilities.yaml                 ← What the agent can do (deploy, email, pay, etc.)
├── providers/                        ← Per-provider state
│   ├── vercel.yaml                   ← Account info, validated at, capabilities
│   ├── supabase.yaml                 ← Project refs, regions, validated at
│   ├── stripe.yaml                   ← Mode (test/live), validated at
│   └── [any-provider].yaml           ← Auto-created when a provider is set up
└── validation-log.json               ← Last validation timestamps

~/any-project/                        ← ANY PROJECT (no config needed!)
├── (your code)                       ← The agent scans this
└── (nothing from us)                 ← No .introdote/ dir in projects
```

### Key Insight: Nothing Lives in the Project

Previous versions put a playbook file in the project. That's wrong. The skill is global — it lives in the user's home directory and works across every project. The project just has code. The agent reads this playbook from `~/.introdote/PLAYBOOK.md` and applies it to whatever project it's currently in.

### capabilities.yaml

This is the global "what can I do?" manifest. Updated every time a new provider is set up:

```yaml
# ~/.introdote/capabilities.yaml
# Auto-generated. Tracks what the agent can do across all projects.

deploy:
  provider: vercel
  can_do:
    - create_project
    - deploy_code
    - set_env_vars
    - manage_domains
  limitations: []

dns:
  provider: cloudflare
  can_do:
    - create_records
    - update_records
    - delete_records
  domains:
    - yourdomain.com
    - otherdomain.dev

domain_registration:
  provider: porkbun
  can_do:
    - search_domains
    - register_domains
  requires_approval: true  # always ask before purchasing

database:
  provider: supabase
  can_do:
    - create_project
    - create_tables
    - manage_rls
    - deploy_edge_functions
    - manage_storage
    - manage_auth
  projects:
    - name: my-saas
      ref: abcdefg
      region: eu-central-1

payments:
  provider: stripe
  mode: test  # or "live"
  can_do:
    - create_products
    - create_checkout
    - manage_subscriptions
    - setup_webhooks

email:
  provider: resend
  can_do:
    - send_transactional
  domains:
    - yourdomain.com  # verified for sending

app_stores:
  apple:
    can_do:
      - submit_builds
      - manage_metadata
    team_id: XXXXXXXXXX
  google_play:
    can_do:
      - upload_apk
      - manage_listings

# Added automatically as providers are configured
# The agent reads this to know what's possible before scanning a project
```

### Provider Files

Each `~/.introdote/providers/[name].yaml` stores non-secret metadata:

```yaml
# ~/.introdote/providers/vercel.yaml
name: Vercel
role: deploy
account: your-username
validated_at: 2025-01-15T10:30:00Z
status: ok
api_docs: https://vercel.com/docs/rest-api
credential_keys:
  - VERCEL_TOKEN
```

### Dev Environment (capabilities.yaml section)

```yaml
# Added during initial setup when user says "I want a dev environment"
dev:
  domain: patrickreinbold.com
  subdomain_pattern: "{project}.patrickreinbold.com"
  deploy:
    provider: lima-city
    method: ftp  # or ssh, api, rsync — whatever the host supports
    # Agent figures out deploy method by researching the provider
  dns:
    provider: cloudflare
    # Manages *.patrickreinbold.com wildcard record
    wildcard_record_id: abc123  # tracked so it can be updated
  database_mode: staging  # use staging/dev instances, not prod
  stripe_mode: test       # always test keys for dev deploys
```

---

## Dev Environment: "preview this"

Separate from the production "finish" flow. The dev environment is for fast iteration — deploy to a subdomain of a domain you already own, instantly, with no production config.

### Setup (during initial onboarding)

When the agent asks about the user's setup, it should also ask:

> "Do you want a dev environment for quick previews? If you have a domain, I can deploy projects to subdomains like `myproject.yourdomain.com` — instant, no custom domain needed."

If yes:

```
1. USER tells agent: their domain, their hosting provider for dev
2. AGENT looks up the hosting provider's deploy method:
   - API deploy? (Vercel, Netlify, Cloudflare Pages) → use API
   - SSH access? → deploy via rsync/scp
   - FTP/SFTP? → deploy via lftp/sftp
   - Something else? → research the provider
3. AGENT sets up wildcard DNS:
   - If DNS is API-managed (e.g., Cloudflare):
     → Create a single *.domain.com CNAME/A record pointing at the dev host
   - If DNS is not API-managed:
     → Guide user to add the wildcard record manually (one-time)
4. AGENT writes dev config to capabilities.yaml
5. AGENT validates: deploy a test page to test.domain.com, confirm it loads
```

### The "preview this" Command

When the user says **"preview this"**, **"dev deploy"**, or **"push to dev"**:

```
1. Determine project name from directory name (or git repo name)
   my-cool-app/ → my-cool-app.patrickreinbold.com

2. Build the project (if needed)
   - Static HTML? → just the files
   - React/Next.js? → npm run build
   - API? → may need a process manager on the host

3. Deploy to dev host using configured method:
   FTP example:
     lftp -u $DEV_FTP_USER,$DEV_FTP_PASS $DEV_FTP_HOST \
       -e "mirror -R ./dist /htdocs/my-cool-app; quit"

   SSH/rsync example:
     rsync -avz ./dist/ $DEV_SSH_USER@$DEV_SSH_HOST:/var/www/my-cool-app/

   API example (Vercel):
     vercel deploy --name=my-cool-app --token=$VERCEL_TOKEN

4. If subdomain DNS isn't wildcard:
   → Create specific DNS record for this subdomain via API

5. Report:
   "✓ Live at https://my-cool-app.patrickreinbold.com"
```

### Dev vs Production

```
                    "preview this"              "finish"
                    ──────────────              ────────
Domain:             project.yourdomain.com      custom domain or root
Deploy target:      dev host (FTP/SSH/free)     prod host
Speed:              seconds — just push files   full pipeline
SSL:                wildcard cert or auto        auto
Database:           staging instance             production instance
Payments:           Stripe test mode             Stripe live mode (if ready)
Env vars:           dev values                   production values
Cleanup:            can be torn down anytime     persistent
Use case:           sharing, iteration, testing  launching to the world
```

### Subdomain Management

The agent tracks active dev deploys:

```yaml
# ~/.introdote/dev-deploys.yaml
deploys:
  - project: my-cool-app
    subdomain: my-cool-app.patrickreinbold.com
    path: /htdocs/my-cool-app
    deployed_at: 2025-01-15T10:30:00Z
    source: /Users/you/code/my-cool-app

  - project: experiment
    subdomain: experiment.patrickreinbold.com
    path: /htdocs/experiment
    deployed_at: 2025-01-14T08:00:00Z
    source: /Users/you/code/experiment
```

The user can say:
- **"list my previews"** → show all active dev deploys
- **"tear down experiment"** → remove deploy + DNS record
- **"preview this as beta"** → deploy to `beta.patrickreinbold.com` instead of auto-naming

### Multi-Host Dev Setups

Some users may want different dev hosts for different project types:

```yaml
dev:
  domain: patrickreinbold.com
  targets:
    static:
      provider: lima-city
      method: ftp
      for: [html, react, vue, svelte, astro, next-static]
    backend:
      provider: fly-io
      method: api
      for: [node, go, python, docker]
    fullstack:
      provider: vercel
      method: api
      for: [next, nuxt, sveltekit]
```

The agent picks the right target based on project type detected in the scan.

---

## The Skill: "finish" / "open your eyes"

When the user says **"finish"**, **"ship it"**, **"open your eyes"**, or **"deploy this"**, the agent executes this sequence:

### Phase 1: Know What I Can Do (read global state)

```
1. Read ~/.introdote/capabilities.yaml
   → Know what providers are configured
   → Know what the agent can do (deploy, email, payments, etc.)

2. Read ~/.introdote/secrets.env
   → Load all credentials

3. If ~/.introdote/ doesn't exist:
   → This is a first-time user
   → Jump to FIRST-TIME SETUP (Section below)
```

### Phase 2: Know What This Project Needs (scan codebase)

```
1. Detect project type (web, mobile, desktop, API, etc.)
2. Scan dependencies for service integrations
3. Scan env var references in source code
4. Check project-level .env files for existing config

Output: list of required capabilities for THIS project
```

### Phase 3: Match & Gap (what's covered, what's missing)

```
For each required capability:
  → Is it in capabilities.yaml?
     YES + validated recently → READY
     YES + stale validation   → RE-VALIDATE
     NO                       → GAP — need to set up

Report to user:
  "This project needs: deploy, database, payments, email.
   You have: deploy ✓, database ✓, payments ✓, email ✗
   One thing to set up: email via Resend (2 minutes)."
```

### Phase 4: Fill Gaps (minimal interaction)

```
For each gap:
  1. If code tells us which provider → research THAT provider
  2. If code doesn't say → ask user ONCE: "what do you use for [role]?"
  3. Fetch live docs for the provider
  4. Guide user to credential page (exact URL, exact steps)
  5. Collect key → validate → store
  6. Update capabilities.yaml
```

### Phase 5: Ship It

```
Once all capabilities are satisfied:

  WEB APPS:
  1. Deploy to configured host
  2. Set environment variables on host (from secrets.env)
  3. Point domain via DNS API
  4. Verify HTTPS is working
  5. Report: "Live at https://yourdomain.com"

  MOBILE APPS:
  1. Build release binary
  2. Code-sign
  3. Submit to App Store / Google Play
  4. Report: "Submitted for review"

  DESKTOP APPS:
  1. Build for target platforms
  2. Code-sign
  3. Create GitHub release / upload to store
  4. Report: "Release published"

  PACKAGES / LIBRARIES:
  1. Run tests
  2. Bump version
  3. Publish to registry
  4. Report: "Published v1.2.3"
```

### Phase 6: Beyond Deploy (the "open your eyes" part)

This is what makes it more than just a deploy tool. After shipping, the agent asks:

```
"Your app is live. Want me to also handle:"

  □ SEO basics
    → Generate meta tags, OpenGraph images, sitemap.xml, robots.txt
    → Submit to Google Search Console (if credentials configured)

  □ App Store Optimization (mobile)
    → Generate screenshots, write description, keywords
    → Localize for target markets

  □ Social presence
    → Generate social card images
    → Draft launch tweet / post (user approves before sending)

  □ Analytics setup
    → Wire up configured analytics provider
    → Set up key event tracking

  □ Monitoring
    → Wire up error tracking
    → Set up uptime monitoring

  □ Legal
    → Generate privacy policy and terms of service (from templates)
    → Add cookie consent (if targeting EU)

  □ Performance
    → Run Lighthouse audit
    → Fix critical performance issues
    → Set up CDN / caching headers

These are all optional. The user picks what they want.
The agent does the work.
```

---

## First-Time Setup

When `~/.introdote/` doesn't exist or has no capabilities configured, the agent runs the onboarding flow. The validation gate isn't a throwaway test page — **it's the dashboard itself**. The first thing the agent deploys is your control panel.

### Open With

> I'm going to set you up so I can deploy and ship your projects automatically. This is a one-time setup — once done, it works for every project on this machine.
>
> At the end, I'll deploy your Introdote dashboard as the first project. If it loads on your domain, everything works.
>
> Tell me about your existing setup:
> - Where do you host websites? (Vercel, Netlify, a traditional webhost, a VPS, etc.)
> - Do you own any domains? Where are they registered? Where is DNS managed?
> - Do you want a dev environment? (I can deploy previews to subdomains of a domain you own)

### Process

```
1. Listen to user's answers
2. Collect MINIMUM credentials to deploy (hosting + DNS):
   a. Fetch the provider's current API docs
   b. Guide user to create/find credentials
   c. Validate each credential
   d. Store in ~/.introdote/secrets.env
   e. Create provider file in ~/.introdote/providers/
3. Build capabilities.yaml
4. DEPLOY THE DASHBOARD as validation:
   a. Build the dashboard (npm run build)
   b. Deploy to user's hosting provider
   c. Point a subdomain (e.g., oye.yourdomain.com) at it via DNS
   d. Wait for it to load
   e. If it loads: setup is complete, everything works
   f. If it fails: diagnose, fix, retry
5. Ask about additional services (database, payments, email, etc.)
   → These are optional — the user can add them later from any project
```

### The Dashboard as Validation Gate

The dashboard is the perfect first deploy because:
- **It proves hosting works** — code got built and served
- **It proves DNS works** — the subdomain resolves
- **It proves the API pipeline works** — the dashboard reads from ~/.introdote/ and shows live data
- **It's immediately useful** — the user has a control panel showing their setup
- **It's self-referential** — the dashboard shows itself as a deployed project

```
FIRST DEPLOY FLOW:

1. Agent builds dashboard:
   cd ~/.introdote/dashboard && npm run build

2. Agent deploys built files to user's host:
   - Vercel API → deploy dist/
   - FTP → upload dist/ to /htdocs/oye/
   - SSH → rsync dist/ to server
   - (whatever the user's host supports)

3. Agent creates DNS record:
   oye.yourdomain.com → deployment URL

4. Agent verifies:
   curl https://oye.yourdomain.com
   → 200 OK? Dashboard loads? ✓ Setup complete.

5. Agent reports:
   "✓ Your dashboard is live at https://oye.yourdomain.com
    It shows your connected services, projects, and dev previews.
    From now on, say 'finish' in any project to ship it."
```

### For Other Users

When someone else installs Introdote and runs the onboarding:
- The same flow applies — their first deploy is their own dashboard
- Their dashboard shows THEIR services, THEIR domains, THEIR projects
- Different providers, same flow — the agent researches whatever they use
- If `oye.theirdomain.com` loads, everything works. If not, the agent debugs.

### Bootstrap Script

```bash
#!/bin/bash
# Creates the ~/.introdote/ structure

mkdir -p ~/.introdote/providers
mkdir -p ~/.introdote/keys

touch ~/.introdote/secrets.env
chmod 600 ~/.introdote/secrets.env

touch ~/.introdote/capabilities.yaml

# Global gitignore
grep -qxF '.introdote/' ~/.gitignore_global 2>/dev/null || \
  echo ".introdote/" >> ~/.gitignore_global
git config --global core.excludesFile ~/.gitignore_global

echo "~/.introdote/ is ready."
```

---

## Project Scan Reference

### Project Type Detection

```
Web App (SPA/SSR):
  → package.json with react, vue, svelte, angular, next, nuxt, sveltekit, astro
  → vite.config.*, next.config.*, nuxt.config.*

Static Site:
  → index.html at root (no framework deps)
  → hugo.toml, _config.yml (Jekyll), mkdocs.yml

Mobile (iOS):
  → *.xcodeproj, *.xcworkspace, Podfile, Package.swift, ios/

Mobile (Android):
  → build.gradle, settings.gradle, AndroidManifest.xml, android/

Cross-Platform Mobile:
  → capacitor.config.*, ionic.config.json
  → app.json with "expo" key
  → pubspec.yaml (Flutter)

Desktop:
  → electron-builder.yml, tauri.conf.json

API / Backend:
  → main.go | manage.py | Gemfile with rails | server.ts | Cargo.toml

Monorepo:
  → pnpm-workspace.yaml, lerna.json, nx.json, turbo.json
  → Scan each sub-project recursively

Containerized:
  → Dockerfile, docker-compose.yml

Serverless:
  → serverless.yml, wrangler.toml, supabase/functions/

Browser Extension:
  → manifest.json with "manifest_version"

Package / Library:
  → Publishable: has "main"/"exports" in package.json, setup.py, Cargo.toml with [lib]
```

### Dependency → Service Mapping

```
HOSTING / DEPLOY:
  vercel.json               → Vercel
  netlify.toml              → Netlify
  wrangler.toml             → Cloudflare Workers/Pages
  fly.toml                  → Fly.io
  Procfile                  → Heroku
  render.yaml               → Render
  railway.toml              → Railway
  Dockerfile (standalone)   → needs container host
  .htaccess / .php          → traditional webhost
  nginx.conf                → traditional webhost

DATABASE:
  @supabase/supabase-js     → Supabase
  @prisma/client            → check DATABASE_URL for provider
  pg, psycopg2              → PostgreSQL (where?)
  mysql2, mysqlclient       → MySQL (where?)
  mongoose, mongodb         → MongoDB (Atlas? self-hosted?)
  @planetscale/database     → PlanetScale
  @neondatabase/serverless  → Neon
  @libsql/client            → Turso
  firebase/firestore        → Firebase
  better-sqlite3            → SQLite (no credentials needed)

AUTH:
  @supabase/ssr             → Supabase Auth
  next-auth, @auth/core     → NextAuth (check providers)
  firebase/auth             → Firebase Auth
  @clerk/*                  → Clerk
  @auth0/*                  → Auth0
  @kinde-oss/*              → Kinde
  lucia                     → Lucia (check adapter)

PAYMENTS:
  stripe, @stripe/stripe-js → Stripe
  @paypal/*                 → PayPal
  @mollie/api-client        → Mollie
  @lemonsqueezy/*           → LemonSqueezy
  paddle-sdk                → Paddle

EMAIL:
  resend                    → Resend
  @sendgrid/mail            → SendGrid
  postmark                  → Postmark
  nodemailer                → SMTP (check config)
  @aws-sdk/client-ses       → AWS SES

STORAGE:
  @supabase/storage-js      → Supabase Storage
  @aws-sdk/client-s3        → S3 (or compatible: R2, MinIO)
  @google-cloud/storage     → GCS
  firebase/storage          → Firebase Storage
  cloudinary                → Cloudinary

ANALYTICS:
  posthog-js                → PostHog
  plausible-tracker         → Plausible
  @vercel/analytics         → Vercel Analytics
  mixpanel                  → Mixpanel

ERRORS:
  @sentry/*                 → Sentry
  logrocket                 → LogRocket
  @datadog/browser-rum      → Datadog

AI/ML:
  openai                    → OpenAI
  @anthropic-ai/sdk         → Anthropic
  @google/generative-ai     → Google AI
  replicate                 → Replicate

CMS:
  @sanity/client            → Sanity
  contentful                → Contentful

SEARCH:
  algoliasearch             → Algolia
  meilisearch               → Meilisearch

PUSH:
  firebase/messaging        → FCM
  @onesignal/*              → OneSignal
  web-push                  → Web Push (VAPID keys)

MOBILE:
  fastlane/                 → App Store + Play Store credentials
  eas.json                  → Expo (EXPO_TOKEN)
  google-services.json      → Firebase (Android)
  GoogleService-Info.plist  → Firebase (iOS)
```

### Detecting Existing Configuration

```
Check in order:
1. ~/.introdote/secrets.env    ← global store (validate keys still work)
2. .env, .env.local, .env.*         ← project-level (note which keys exist)
3. Shell environment                ← already exported
4. Config files                     ← supabase/config.toml, wrangler.toml, etc.
5. CI/CD references                 ← .github/workflows (secret names only)

Also grep source for unreferenced env vars:
  process.env.*, os.environ, import.meta.env.*, env("...")
  → Any env var in code but not in any .env file = gap
```

---

## Platform-Specific Needs

### Mobile (iOS)
```
HUMAN: Log into Apple Developer ($99/yr), approve app submission
AGENT: Everything else — signing, provisioning, builds, metadata, screenshots

Credentials needed:
  APPLE_TEAM_ID
  APPLE_API_KEY_ID + APPLE_API_ISSUER_ID + .p8 file
  (Agent stores .p8 in ~/.introdote/keys/)
```

### Mobile (Android)
```
HUMAN: Log into Google Play Console ($25), approve app submission
AGENT: Everything else — keystores, builds, listings, screenshots

Credentials needed:
  Google Play service account JSON (→ ~/.introdote/keys/)
  Android keystore (agent can generate one)
```

### Desktop (Electron / Tauri)
```
HUMAN: Purchase code-signing certificates
AGENT: Build, sign, notarize, create releases, auto-update

Credentials needed:
  macOS: Apple Developer ID cert + notarization credentials
  Windows: Code signing cert (.pfx)
  Tauri: TAURI_SIGNING_PRIVATE_KEY
```

### Browser Extensions
```
HUMAN: Register developer accounts (Chrome $5, Firefox free)
AGENT: Package, upload, manage listings

Credentials needed:
  Chrome: OAuth2 client credentials
  Firefox: JWT API credentials
```

### Packages / Libraries
```
HUMAN: Create registry account
AGENT: Build, test, version, publish

Credentials needed:
  npm: NPM_TOKEN | PyPI: PYPI_API_TOKEN | crates.io: CARGO_REGISTRY_TOKEN
```

### Containers
```
HUMAN: Create registry + host accounts
AGENT: Build images, push, deploy, scale

Credentials needed:
  Registry: DOCKER_USERNAME + token, or GITHUB_TOKEN, or cloud credentials
  Host: FLY_API_TOKEN, RAILWAY_TOKEN, cloud credentials, or SSH
```

---

## Gap Analysis: Think in User Flows

Don't think in services. Think in what the end user does:

```
"A user visits the site"
  → Need: hosting + DNS + domain + SSL
  → All wired up? → Ship it
  → Missing DNS? → Ask where DNS is managed, set up once globally

"A user signs up"
  → Need: auth + email (for verification)
  → Auth configured but no email? → Signups silently fail. Fix this.

"A user pays"
  → Need: payments + webhooks + database (to record transactions)
  → Stripe key but no webhook secret? → Payments won't be recorded.

"A developer says 'ship it'"
  → Need: deploy pipeline
  → Code ready but no deploy target? → That's why we're here.
```

### Polyfill Rules

- **Never replace** what works
- **Cloudflare as DNS polyfill** — registrar has no DNS API? Point nameservers to Cloudflare.
- **SSH/FTP as deploy fallback** — host has no API? Deploy via rsync.
- **SMTP as email fallback** — no email API? Most hosts include SMTP.
- **Only suggest new services** when a user flow is actually broken

---

## Credential Collection Protocol

The agent delivers a **full-service experience**. The human should never have to figure out where to go or what to click. The agent opens the pages, explains what to do on each one, and handles everything after the key is pasted.

For EVERY credential, even for well-known providers:

```
1. FETCH the provider's current docs (never trust training data)
2. FIND the exact current URL to:
   a. The sign-up / login page (if user doesn't have an account)
   b. The API key creation page
   c. The permissions / scopes selection page (if applicable)
3. OPEN the URL for the user:
   → Use `open` (macOS), `xdg-open` (Linux), or `start` (Windows)
   → Example: open "https://vercel.com/account/tokens"
   → Tell the user: "I've opened the page. Here's what to do there:"
4. TELL them exactly what to do on that page:
   → "Click 'Create Token'"
   → "Name it 'introdote'"
   → "Select 'Full Account' scope"
   → "Click 'Create'"
   → "Copy the token and paste it here"
   → Be specific about button labels, dropdown values, toggle states
5. COLLECT: "Paste it here."
6. VALIDATE immediately with a real API call
7. STORE in ~/.introdote/secrets.env
8. UPDATE capabilities.yaml and providers/[name].yaml
9. CONFIRM in one sentence: "✓ Connected to Vercel (account: patrick)"
10. OPEN the next URL — don't wait, keep the flow moving
```

### Full-Service Means:

```
DON'T: "You'll need a Vercel API token. Go to vercel.com/account/tokens."
DO:    [opens vercel.com/account/tokens in browser]
       "I've opened Vercel's token page. Click 'Create Token', name it
        'introdote', select 'Full Account', click 'Create', and
        paste the token here."

DON'T: "You need to add DNS records for email verification."
DO:    [looks up the exact records needed]
       [adds them via DNS API automatically]
       "Done — I've added the DNS records. Verification should complete
        in a few minutes."

DON'T: "Configure your environment variables on Vercel."
DO:    [pushes env vars to Vercel via API automatically]
       "Environment variables synced to Vercel."

DON'T: "You'll need to set up a webhook endpoint in Stripe."
DO:    [creates the webhook via Stripe API]
       "Webhook created and pointing at your deploy URL."
```

### Batch for Speed

Don't make the user do one thing at a time. Open all the credential pages at once:

```
Agent opens 3 browser tabs simultaneously:
  Tab 1: hosting provider's API key page
  Tab 2: DNS provider's API token page
  Tab 3: domain registrar's API page

Agent: "I've opened 3 tabs for you:
        1. [Provider A] — create an API key, name it 'introdote', paste here
        2. [Provider B] — create a token with DNS edit permissions, paste here
        3. [Provider C] — create an API key, paste both the key and secret here
        
        Go through them in any order. I'll validate each one as you paste it."
```

### When Validation Fails (agent diagnoses, doesn't punt)

```
401 → Wrong key, expired, or wrong type. Check whitespace. Guide to recreate.
403 → Key works but wrong permissions. Re-open the page, guide to correct scope.
404 → Endpoint changed. Re-fetch live docs. Update validation call.
Timeout → Service down? Check status page. Retry later.
```

---

## Validation Gates

### Gate 0: The Dashboard (first-time setup)

The dashboard itself is the first validation gate. During initial setup, deploying the dashboard proves hosting + DNS + the full pipeline works. No throwaway test page needed.

See **First-Time Setup** section above for the full flow.

### Subsequent Gates (per-project)

When shipping other projects, validate based on what the project uses:

| If project has... | Test |
|---|---|
| Web hosting | Deploy succeeds, URL returns 200 |
| Custom domain | Domain resolves, HTTPS works |
| Database | Create table, write, read, clean up |
| Payments | Create test product, clean up |
| Email | Send test email to user |
| iOS target | Validate signing + App Store Connect |
| Android target | Validate keystore + Google Play |
| Container | Push test image to registry |

Protocol: tell user what you'll do → get approval → do it → report → clean up.

---

## After "finish": The Checklist

When the agent ships a project, it doesn't just deploy. It runs through everything that makes a launch real:

```
DEPLOY (automatic):
  ✓ Code deployed to host
  ✓ Environment variables synced
  ✓ Domain pointed + HTTPS confirmed
  ✓ Database migrations run (if applicable)

LAUNCH READINESS (agent offers, user picks):
  □ SEO: meta tags, OG images, sitemap.xml, robots.txt
  □ Legal: privacy policy, terms of service, cookie consent
  □ Performance: Lighthouse audit, fix critical issues
  □ Analytics: wire up tracking, set key events
  □ Monitoring: error tracking, uptime checks
  □ Social: generate social cards, draft launch post
  □ App Store (mobile): screenshots, description, keywords, submit
  □ Marketing page: generate landing page if the project is an API/tool

Each item: agent does the work, user approves the result.
```

---

## Installation

### For Users

```bash
# Clone and install globally
git clone https://github.com/[you]/introdote.git /tmp/oye-install
bash /tmp/oye-install/install.sh
rm -rf /tmp/oye-install

# Or manually:
mkdir -p ~/.introdote/providers ~/.introdote/keys
cp PLAYBOOK.md ~/.introdote/PLAYBOOK.md
chmod 600 ~/.introdote/secrets.env
```

Then in any project, tell your AI agent: **"finish"** or **"open your eyes"**.

### For Claude Code Users

Add to your `~/.claude/CLAUDE.md`:

```markdown
## Introdote

When I say "finish", "ship it", "deploy", or "open your eyes":
1. Read ~/.introdote/PLAYBOOK.md
2. Follow its instructions to scan this project and ship it
```

Or create it as a slash command / skill for even tighter integration.

---

## Summary

```
WHAT IT IS:
  A global agent skill that lives in ~/.introdote/
  Works across every project on your machine
  Set up once — never fill out the same questionnaire twice

WHAT IT DOES:
  Scans any project → detects what's needed → checks what you have →
  fills gaps (minimal interaction) → deploys → handles launch checklist

WHAT THE HUMAN DOES:
  Approves. Logs in. Pays. That's it.

WHAT THE AGENT DOES:
  Everything else. Research. Config. Deploy. Validate. Troubleshoot.
  SEO. Legal. Performance. Analytics. App Store. Marketing.
  All using LIVE documentation, never stale training data.
```
