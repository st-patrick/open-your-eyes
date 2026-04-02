# Auto-Deploy Agent Playbook

## Vision

A single playbook file that any AI agent (Claude Code, Cursor, etc.) can follow to **talk a user through collecting every API key and credential** needed to give the agent full power to build, deploy, and publish websites to custom domains — the "last mile" convenience that Lovable provides, but running locally through your own accounts.

The end state: a user starts a conversation, the agent walks them through setup step-by-step, validates everything works, and from that point forward the agent can go from "build me X" to a live site at `yourname.com` with zero manual steps.

---

## What This Is

A **meta-playbook**: instructions for the agent on how to interactively onboard a human. It covers:

1. **What to ask for** — which services, which keys, in what order
2. **How to guide them** — step-by-step instructions the agent reads to the user (with screenshots/links to exact dashboard pages)
3. **How to validate** — API calls the agent makes to confirm each key works
4. **How to store** — where credentials go so they persist across sessions
5. **How to test end-to-end** — deploy a "hello world" to prove the full pipeline works

---

## The Credential Stack

These are the services (with recommended defaults) that give an agent full deploy power:

### Tier 1: Minimum Viable Deploy (get a site live on a custom domain)
| Service | Purpose | Provider | Key Type |
|---------|---------|----------|----------|
| **Hosting** | Build + serve the site | Vercel | API Token |
| **Domain DNS** | Point domain → hosting | Cloudflare | API Token (zone-scoped) |
| **Domain Registration** | Buy/manage domains | Porkbun | API Key + Secret |

### Tier 2: Full-Stack App (database, auth, storage)
| Service | Purpose | Provider | Key Type |
|---------|---------|----------|----------|
| **Database + Auth + Storage** | Backend-as-a-service | Supabase | Service Role Key + Management API Token |
| **Payments** | Accept money | Stripe | Secret Key + Webhook Secret |

### Tier 3: Production Polish (email, monitoring, analytics)
| Service | Purpose | Provider | Key Type |
|---------|---------|----------|----------|
| **Transactional Email** | Send emails from app | Resend | API Key |
| **Analytics** | Usage tracking | PostHog (or Plausible) | API Key |
| **Error Monitoring** | Catch production errors | Sentry | DSN + Auth Token |

---

## Playbook Structure

The playbook is a single master file (`PLAYBOOK.md`) that the agent follows as a conversation script. It's organized as a decision tree with these sections:

```
PLAYBOOK.md                    # The master agent script
  ├── 0. Intro & Assessment    # What does the user already have?
  ├── 1. Hosting Setup         # Vercel account + API token
  ├── 2. DNS Setup             # Cloudflare account + API token
  ├── 3. Domain Registration   # Porkbun account + API key
  ├── 4. Validation Gate 1     # Deploy hello-world to custom domain
  ├── 5. Database Setup        # Supabase account + keys
  ├── 6. Payments Setup        # Stripe account + keys
  ├── 7. Validation Gate 2     # Full-stack smoke test
  ├── 8. Email Setup           # Resend account + API key
  ├── 9. Final Validation      # End-to-end deploy test
  └── 10. Credential Summary   # Recap what's stored where
```

### Conversation Flow Per Service

Each service section follows this pattern:

```markdown
## N. [Service Name] Setup

### Check
> Agent: Do you already have a [Service] account with API access?
> → YES: Skip to "Collect Key"
> → NO: Continue to "Create Account"

### Create Account
> Agent: Here's how to set up [Service]:
> 1. Go to [exact URL]
> 2. Sign up (free tier is fine for now)
> 3. [Exact steps to navigate to API key page]
> 4. [What to name the key, what permissions to select]

### Collect Key
> Agent: Please paste your [Service] API key.
> (I'll validate it works and store it securely — it won't leave your machine.)

### Validate
[Agent runs]: `curl -H "Authorization: Bearer $KEY" https://api.service.com/verify`
> ✓ Key works! Connected to account "[account name]".
> ✗ That key didn't work. Common issues: [troubleshooting steps]

### Store
Write to `~/.lovable/secrets.env`:
```
SERVICE_API_KEY=sk-xxx
```
```

---

## Credential Storage

```
~/.lovable/
  secrets.env          # All API keys (never committed, never leaves machine)
  config.yaml          # Non-secret config (preferred region, default framework, etc.)
  validation-log.json  # Record of last successful validation per service
```

The playbook instructs the agent to:
- Create `~/.lovable/` if it doesn't exist
- Add `~/.lovable/` to global gitignore
- Validate keys before storing
- Log successful validations with timestamps

---

## Provider Alternatives

The playbook has a recommended default for each service but supports alternatives:

| Role | Default | Alternatives |
|------|---------|-------------|
| Hosting | Vercel | Netlify, Cloudflare Pages, Fly.io |
| DNS | Cloudflare | Route53, Vercel DNS |
| Domains | Porkbun | Namecheap, Cloudflare Registrar, Google Domains |
| Database | Supabase | PlanetScale, Neon, Turso |
| Payments | Stripe | Lemonsqueezy, Paddle |
| Email | Resend | Postmark, SendGrid, AWS SES |
| Analytics | PostHog | Plausible, Umami |
| Errors | Sentry | LogRocket, Highlight |

Each alternative gets a section in the playbook with its own create/collect/validate flow.

---

## Validation Gates

The playbook has checkpoint moments where the agent proves things work:

### Gate 1: "Can I put a site on your domain?"
- Agent scaffolds a one-page HTML site
- Deploys to Vercel via API
- Configures DNS on Cloudflare to point domain
- Waits for propagation
- Confirms `https://yourdomain.com` resolves

### Gate 2: "Can I build a full-stack app?"
- Agent creates a Supabase project (or connects to existing)
- Creates a test table, writes a row, reads it back
- Confirms Stripe test mode works (creates a test product)
- Tears down test resources

### Gate 3: "Everything works end-to-end"
- Agent deploys a mini app with: a page, a DB read, an email send
- Confirms all services talk to each other in production
- Tears down test deployment

---

## Build Order

### Step 1: Master Playbook — Tier 1 (Hosting + DNS + Domain)
Write `PLAYBOOK.md` covering:
- Intro/assessment flow
- Vercel setup (account creation, API token, validation)
- Cloudflare setup (account creation, zone-scoped API token, validation)
- Porkbun setup (account creation, API key+secret, validation)
- Validation Gate 1 (deploy + domain hookup)
- Credential storage setup

### Step 2: Extend Playbook — Tier 2 (Database + Payments)
Add to `PLAYBOOK.md`:
- Supabase setup (account, project, service role key, management API)
- Stripe setup (account, test/live keys, webhook secret)
- Validation Gate 2

### Step 3: Extend Playbook — Tier 3 (Email + Polish)
Add to `PLAYBOOK.md`:
- Resend setup
- Optional: PostHog, Sentry
- Validation Gate 3
- Final credential summary

### Step 4: Alternative Providers
Add branching sections for each alternative provider per role.

### Step 5: CLAUDE.md Integration
Write the companion `CLAUDE.md` that tells agents:
- Where to find the playbook
- When to run it (new user, missing keys, expired keys)
- How to use collected credentials to actually deploy
- Post-setup: what the agent can now do

---

## Design Principles

1. **Conversational, not technical** — The agent explains things like a patient colleague, not a man page. Jargon gets defined on first use.

2. **Fail forward** — If a key doesn't work, diagnose and retry. Never leave the user stuck. Provide exact troubleshooting for every validation failure.

3. **Progressive** — Start with Tier 1. A user can stop after Gate 1 and still have a working deploy pipeline. Tiers 2-3 are additive.

4. **Validate everything** — Never trust a key until you've made a real API call with it. Store the validation result.

5. **Secure by default** — Keys stored in `~/.lovable/secrets.env`, never in project dirs, never in git, never transmitted anywhere.

6. **Provider-flexible** — Recommended defaults reduce decision fatigue, but every service slot can be swapped.
