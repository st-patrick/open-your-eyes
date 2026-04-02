# Open Your Eyes — Agent Playbook

> **What is this?** A meta-playbook for AI agents. It doesn't prescribe providers — it teaches the agent how to **discover what the user already uses**, research those providers' APIs on the fly, and collect credentials for whatever stack the user actually has. The goal: give the agent full power to auto-deploy publicly available sites using the user's existing accounts.

---

## 0. Philosophy

This playbook is **provider-agnostic by design**. We don't say "go set up Vercel." We say "where do you host things?" — and if the answer is lima-city, Hetzner, Uberspace, or some regional provider the agent has never heard of, the agent **looks it up** and figures out their API.

Well-known providers (Cloudflare, Vercel, etc.) are only used as:
- **Fallback** — when the user's existing provider doesn't offer a needed capability (e.g., no API for DNS management)
- **Polyfill** — to fill gaps (e.g., user has hosting but no CDN/SSL → layer Cloudflare in front)
- **Suggestion** — when the user has no existing provider for a role and asks "what do you recommend?"

---

## 1. The Discovery Conversation

Start here. The agent's job is to **map out what the user already has** before suggesting anything.

### Open With

> I'm going to help you set up your accounts so I can deploy websites for you automatically — from code to live site on your own domain.
>
> But first, I need to understand what you're already using. I don't want to push you toward specific providers — I want to work with what you have.

### Ask These Questions (adapt conversationally, don't interrogate)

**Domains:**
> Do you own any domains? Where are they registered? Where is their DNS managed?
> (These are sometimes different — e.g., domain bought at GoDaddy but DNS pointed at Cloudflare.)

**Hosting / Webspace:**
> Where do you host websites today? This could be anything — a traditional webhost with FTP, a VPS, a cloud platform like Vercel, a shared hoster like lima-city or Hetzner — whatever you use.

**Database:**
> Do you use any databases? If so, where do they run? (Could be part of your hosting, could be a separate service like Supabase or PlanetScale, could be a self-managed Postgres on a VPS.)

**Payments:**
> If you need to accept payments, do you already have a payment processor? (Stripe, PayPal, Mollie, Lemonsqueezy, etc.)

**Email:**
> Do you have a way to send emails programmatically from your apps? (Resend, Postmark, SendGrid, or maybe your webhost includes SMTP?)

**Other services:**
> Anything else you use regularly? Analytics, error tracking, CI/CD, object storage, CDN? I want to know what's already in your toolkit.

### Record the Inventory

After the conversation, the agent builds a mental map:

```
USER'S EXISTING STACK:
├── Domains: [registrar] + [DNS provider]
├── Hosting: [provider + type (shared/VPS/PaaS/static)]
├── Database: [provider or "included in hosting" or "none"]
├── Payments: [provider or "none"]
├── Email: [provider or "included in hosting" or "none"]
└── Other: [list anything mentioned]
```

---

## 2. Capability Assessment

For each role in the stack, the agent needs to determine: **can I automate this via API?**

### The Roles

| Role | What the agent needs | Minimum API capability |
|------|---------------------|----------------------|
| **Deploy** | Push code, get a live URL | Deploy via API/CLI, or SSH/FTP access |
| **DNS** | Point domains at deployments | Create/update DNS records via API |
| **Domain Registration** | Buy new domains (optional) | Domain search + registration via API |
| **Database** | Create tables, read/write data | SQL access or REST API |
| **Auth** | User signup/login | Auth API or self-hosted solution |
| **Payments** | Charge money | Payment API with checkout/subscription support |
| **Email** | Send transactional emails | SMTP credentials or email API |
| **Storage** | Store files/uploads | Object storage API or filesystem access |

### For Each Provider the User Names

The agent should:

1. **Look up the provider's API documentation** — search for `"[provider name] API documentation"` or `"[provider name] developer API"`
2. **Determine what's automatable** — Does it have a REST API? CLI tool? Only a web dashboard?
3. **Identify the credential type** — API key? OAuth token? SSH key? FTP credentials? Username + password?
4. **Find the exact page** where the user creates/finds their credentials
5. **Write a validation call** — a minimal API request to prove the credential works

### Decision Tree Per Role

```
For each role (deploy, DNS, database, etc.):
│
├── User has a provider for this role?
│   ├── YES → Does that provider have an API?
│   │   ├── YES → Guide user to get API credentials → Validate → Store
│   │   ├── PARTIAL → Use what's available, polyfill gaps
│   │   │   Example: Host has FTP but no deploy API
│   │   │   → Use FTP for deploys (via lftp/sftp commands)
│   │   │   Example: Host has DNS panel but no DNS API
│   │   │   → Suggest pointing nameservers to Cloudflare for API-managed DNS
│   │   └── NO (dashboard-only) → Discuss alternatives:
│   │       → Can we work around it? (e.g., SSH + scripts)
│   │       → Should we layer something on top? (e.g., Cloudflare for DNS)
│   │       → Or does the user want to switch providers for this role?
│   └── NO → Does the user want this capability?
│       ├── YES → Suggest options, let user choose, then guide setup
│       └── NO → Skip this role
```

---

## 3. Provider Research Protocol

When the user names a provider the agent doesn't know well, follow this protocol:

### Step 1: Research
```
Search for:
- "[provider] API documentation"
- "[provider] developer portal"
- "[provider] REST API"
- "[provider] CLI tool"
- "[provider] API key" OR "[provider] access token"
```

Read the API docs. Determine:
- **Base URL** for API requests
- **Auth method** (Bearer token, API key header, Basic auth, etc.)
- **Key endpoints** relevant to the role (e.g., for hosting: deploy endpoint; for DNS: record management endpoint)
- **How to create credentials** (exact dashboard URL and steps)
- **Rate limits or restrictions** on the free tier

### Step 2: Build the Guide
Write a provider-specific guide with:
- Exact URL to the credentials page
- Step-by-step to create the right type of credential
- What permissions/scopes to select
- A validation API call

### Step 3: Validate
Construct a minimal API call that:
- Uses the credential the user provides
- Hits a read-only endpoint (list projects, get account info, etc.)
- Confirms the credential works without modifying anything
- Reports back the account name/email as confirmation

### Step 4: Store
Write the credential to `~/.open-your-eyes/secrets.env` with a clear variable name:
```bash
# Use a consistent naming convention:
# [PROVIDER]_[CREDENTIAL_TYPE]
# Examples:
VERCEL_TOKEN=xxx
LIMACITY_FTP_USER=xxx
LIMACITY_FTP_PASS=xxx
HETZNER_API_TOKEN=xxx
PORKBUN_API_KEY=xxx
PORKBUN_SECRET_KEY=xxx
```

---

## 4. Gap Analysis & Polyfill

After mapping the user's stack and collecting credentials, identify gaps:

### Common Gaps and Polyfills

**"My host doesn't have a deploy API"**
- If they have SSH: deploy via `rsync` or `scp`
- If they have FTP/SFTP: deploy via `lftp` or `sftp` commands
- If dashboard-only: suggest adding a PaaS (Vercel free tier, Cloudflare Pages, Netlify) for projects that need auto-deploy, keep existing host for other things

**"My registrar doesn't have a DNS API"**
- Point the domain's nameservers to Cloudflare (free) → manage DNS via Cloudflare API
- This is the one case where Cloudflare is actively recommended — it's the universal DNS polyfill

**"My host includes a database but no external API"**
- If SSH access exists: connect via SSH tunnel
- If phpMyAdmin/Adminer exists: limited automation possible
- Suggest a managed DB service (Supabase, Neon, PlanetScale) for projects that need API-driven database access

**"My host includes email/SMTP"**
- Collect SMTP credentials (host, port, username, password)
- The agent can send email via SMTP just as well as via an email API
- Store as `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

**"I don't have anything for [role]"**
- Only then suggest providers. Offer 2-3 options with trade-offs:
  > For hosting, you could use:
  > - **Vercel** — best for React/Next.js, generous free tier
  > - **Cloudflare Pages** — great for static sites, unlimited bandwidth
  > - **Fly.io** — good if you need server-side processes
  > Which sounds right for what you're building?

---

## 5. Validation Gates

Don't validate in isolation — validate the **pipeline**. After collecting credentials, prove the full chain works.

### Gate 1: "Can I put a site on your domain?"

The agent should:
1. Create a minimal HTML page
2. Deploy it using whatever method the user's host supports (API, FTP, SSH, rsync, CLI)
3. If DNS is API-managed: point the domain at the deployment
4. Confirm `https://yourdomain.com` (or a subdomain) serves the page
5. Clean up the test deployment

Tell the user what you're about to do and ask permission first.

### Gate 2: "Can I build a full-stack app?" (if Tier 2 services are configured)

The agent should:
1. Create a test table in the database
2. Insert and read back a row
3. If payments configured: create and delete a test product
4. Clean up all test resources

### Gate 3: "Can I send emails from your app?" (if email is configured)

The agent should:
1. Send a test email to the user
2. Confirm they received it

---

## 6. Credential Storage

### Location
```
~/.open-your-eyes/
├── secrets.env           # All credentials — never committed, never leaves machine
├── config.yaml           # Non-secret config (provider choices, regions, preferences)
└── validation-log.json   # Record of last successful validation per service
```

### Setup (run once at start)
```bash
mkdir -p ~/.open-your-eyes
touch ~/.open-your-eyes/secrets.env
chmod 600 ~/.open-your-eyes/secrets.env

# Global gitignore
grep -qxF '.open-your-eyes/' ~/.gitignore_global 2>/dev/null || echo ".open-your-eyes/" >> ~/.gitignore_global
git config --global core.excludesFile ~/.gitignore_global
```

### secrets.env Format
```bash
# ===== DEPLOY =====
# Provider: [whatever they use]
DEPLOY_PROVIDER=vercel
VERCEL_TOKEN=xxx

# ===== DNS =====
# Provider: [whatever they use]
DNS_PROVIDER=cloudflare
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ZONE_ID=xxx

# ===== DOMAINS =====
DOMAIN=yourdomain.com
DOMAIN_REGISTRAR=porkbun
PORKBUN_API_KEY=xxx
PORKBUN_SECRET_KEY=xxx

# ===== DATABASE =====
# Provider: [whatever they use]
DB_PROVIDER=supabase
SUPABASE_URL=https://abc.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# ===== PAYMENTS =====
PAYMENTS_PROVIDER=stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx

# ===== EMAIL =====
EMAIL_PROVIDER=smtp
SMTP_HOST=mail.example.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
```

Note the pattern: each section has a `[ROLE]_PROVIDER=name` line so the agent knows which provider is in use for each role, followed by that provider's specific credentials.

### config.yaml
```yaml
# Non-secret preferences
stack:
  default_framework: react  # or next, vue, svelte, etc.
  default_language: typescript

deploy:
  provider: vercel  # mirrors secrets.env for quick lookup
  region: eu-central-1

dns:
  provider: cloudflare
  domain: yourdomain.com

preferences:
  confirm_before_deploy: true
  confirm_before_domain_purchase: true
  auto_cleanup_test_deploys: true
```

### validation-log.json
```json
{
  "last_full_validation": "2025-01-15T10:30:00Z",
  "services": {
    "deploy": {
      "provider": "vercel",
      "status": "ok",
      "validated_at": "2025-01-15T10:30:00Z",
      "account": "username"
    },
    "dns": {
      "provider": "cloudflare",
      "status": "ok",
      "validated_at": "2025-01-15T10:30:00Z",
      "domain": "yourdomain.com"
    }
  }
}
```

---

## 7. Re-entry Points

The playbook isn't just for first-time setup. The agent should re-enter it when:

- **Missing credential**: Agent tries to deploy but `VERCEL_TOKEN` is empty → run the deploy section
- **Expired credential**: API returns 401 → guide the user through rotation
- **New capability needed**: User says "I need payments now" → run the payments discovery
- **New provider**: User says "I switched from Vercel to Fly.io" → research Fly.io, collect new credentials, update secrets.env
- **Re-validation**: User says "check everything still works" → run all validation gates

---

## 8. How to Use This Playbook

**If you're a human:** Start a conversation with an AI agent in this directory and say:
> "Set me up so you can deploy sites for me."

The agent will ask what you already use and work from there.

**If you're an AI agent:** Follow sections 1-6 in order. Be conversational. Don't rush. When the user names a provider you don't know, research it (Section 3). When there's a gap, discuss options (Section 4). Validate the pipeline, not just individual keys (Section 5).

**The cardinal rule:** Adapt to the user's existing stack. Never push a provider when they already have something that works.
