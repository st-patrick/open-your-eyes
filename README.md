# Open Your Eyes

**Say "finish" to your AI agent. It ships your project.**

Open Your Eyes is a global agent skill that gives AI coding assistants (Claude Code, Cursor, etc.) the power to deploy, publish, and launch your projects. Set it up once — it works for every project on your machine.

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/yourusername/open-your-eyes.git /tmp/oye
bash /tmp/oye/install.sh
rm -rf /tmp/oye
```

This creates `~/.open-your-eyes/` on your machine. If you use Claude Code, it auto-adds the skill trigger to `~/.claude/CLAUDE.md`.

### 2. Initial Setup (one time, ~15 minutes)

Open any project in your AI agent and say:

> "open your eyes"

The agent asks what you already use — your hosting, your domain registrar, whatever you have. Then for each one:

1. The agent **looks up the provider's current API docs** (even providers it's never heard of)
2. Tells you **exactly what to click** — the URL, the button, the scope to select
3. You **paste the key**
4. The agent **validates it works** and stores it securely

Then **it deploys the dashboard as your first project** — your own control panel at `oye.yourdomain.com`. If it loads, everything works. You now have a live dashboard showing your connected services, domains, and projects.

That's it. You do this once. Every project on your machine can now use these credentials.

### 3. Use It

In any project, say:

> "finish"

The agent scans your code, figures out what it needs, checks your global credentials, and ships it.

Or say:

> "preview this"

The agent deploys to a dev subdomain (like `myproject.yourdomain.com`) for quick iteration. No production domain needed.

---

## What Happens When You Say "finish"

```
You say: "finish"

Agent:
  1. Scans your project
     → "This is a Next.js app with Supabase and Stripe"

  2. Checks your global credentials
     → "You have Vercel, Cloudflare, Supabase, and Stripe configured"

  3. Fills gaps (if any)
     → "I see you're using Resend but I don't have a key. Go to [URL], paste the key."

  4. Ships it
     → Deploys code
     → Syncs environment variables
     → Points your domain
     → Runs database migrations
     → "Live at https://yourdomain.com"

  5. Offers more
     → "Want me to set up SEO, analytics, legal pages, or social cards?"
```

**You approved and pasted one key. The agent did everything else.**

---

## Dev Environment

Not every deploy needs a production domain. Open Your Eyes supports a **dev setup** where projects get deployed to subdomains of a domain you own.

### How it works

During initial setup, tell the agent:

> "I also want a dev environment. I have a domain at patrickreinbold.com — use subdomains for dev deploys."

The agent sets up:
- A **wildcard DNS record** (`*.patrickreinbold.com` → your dev host)
- A **dev hosting target** (your existing webhost via FTP/SSH, or Vercel/Netlify free tier)
- Automatic subdomain naming from the project directory name

Then in any project:

```
you:   "preview this"
agent: "Deployed to https://my-cool-app.patrickreinbold.com"
```

### What it looks like in capabilities.yaml

```yaml
dev:
  domain: patrickreinbold.com
  subdomain_pattern: "{project}.patrickreinbold.com"
  deploy:
    provider: lima-city
    method: ftp
  dns:
    provider: cloudflare  # manages *.patrickreinbold.com
```

### Dev vs Production

| | Dev ("preview this") | Production ("finish") |
|---|---|---|
| **Domain** | `project.yourdomain.com` | custom domain or root |
| **Deploy target** | your dev host (FTP, free tier, etc.) | your prod host |
| **Speed** | seconds — just push files | full pipeline |
| **SSL** | automatic via wildcard | automatic |
| **Database** | dev/staging instance | production instance |
| **Payments** | Stripe test mode | Stripe live mode |
| **When to use** | quick iteration, sharing previews | launching to the world |

---

## What You Set Up vs What the Agent Does

```
YOU                              THE AGENT
───                              ─────────
Approve actions                  Research provider APIs
Log into dashboards              Read live documentation
Paste API keys                   Validate credentials
Pay for services                 Configure everything
                                 Deploy code
                                 Point domains
                                 Sync environment variables
                                 Run migrations
                                 Set up SSL
                                 Generate SEO tags
                                 Create legal pages
                                 Audit performance
                                 Wire up analytics
                                 Submit to app stores
                                 Troubleshoot failures
                                 ...everything else
```

---

## Example: Full Setup Walkthrough

Here's what initial setup looks like with Claude Code:

```
you:   "open your eyes"

agent: "I'm going to set you up so I can ship your projects automatically.
        This is one-time — after this, it works for every project.

        What services do you already use? Tell me about:
        - Where you host websites
        - Where your domains are registered
        - Any databases, payment processors, email services"

you:   "I host on lima-city, domains at Porkbun, DNS on Cloudflare,
        database is Supabase, payments with Stripe"

agent: [looks up lima-city API docs]
       [looks up Porkbun API docs]
       [looks up current Cloudflare, Supabase, Stripe docs]

       "Got it. I need 5 keys from you. Open these tabs:
        1. lima-city: [exact URL to API settings]
        2. Porkbun: [exact URL to API page]
        3. Cloudflare: [exact URL to API tokens]
        4. Supabase: [exact URL to project API settings]
        5. Stripe: [exact URL to API keys]

        For each: create a key, paste it here."

you:   [pastes lima-city key]
agent: "✓ Connected to lima-city (account: patrick)"

you:   [pastes Porkbun keys]
agent: "✓ Porkbun API works"

you:   [pastes Cloudflare token]
agent: "✓ Cloudflare connected. Found 2 domains: patrickreinbold.com, other.dev"

you:   [pastes Supabase keys]
agent: "✓ Supabase connected (project: my-app, region: eu-central-1)"

you:   [pastes Stripe key]
agent: "✓ Stripe connected (test mode)"

agent: "All keys validated. Now let me prove it works.
        I'm going to deploy your Open Your Eyes dashboard
        to oye.patrickreinbold.com — your personal control panel."

       [builds the dashboard]
       [deploys to lima-city via FTP]
       [creates DNS record: oye.patrickreinbold.com → lima-city]
       [waits for DNS propagation]

       "✓ Dashboard is live at https://oye.patrickreinbold.com
        It shows all your connected services, domains, and projects.

        Setup complete. I can now:
        ✓ Deploy to lima-city
        ✓ Buy/manage domains via Porkbun
        ✓ Manage DNS for your domains
        ✓ Create and manage databases
        ✓ Process payments (test mode)

        Say 'finish' in any project to ship it.
        Say 'preview this' to deploy to a subdomain of patrickreinbold.com."
```

---

## Example: Shipping a Project

```
you:   cd ~/code/my-saas-app
you:   "finish"

agent: "Scanned your project: Next.js app with Supabase + Stripe.

        All services configured ✓
        Deploying to Vercel...
        Setting environment variables...
        Pointing my-saas-app.com via Cloudflare...
        Running database migrations...

        ✓ Live at https://my-saas-app.com

        Want me to also handle:
        □ SEO (meta tags, sitemap, OG images)
        □ Legal (privacy policy, terms)
        □ Performance audit"

you:   "yes, all of it"

agent: [does it all]
       "Done. Lighthouse score: 96. All pages have meta tags.
        Privacy policy at /privacy, terms at /terms."
```

---

## Example: Quick Dev Preview

```
you:   cd ~/code/experiment
you:   "preview this"

agent: "Deploying to experiment.patrickreinbold.com...
        ✓ Live at https://experiment.patrickreinbold.com"
```

---

## Supported Project Types

| Type | What the agent does |
|---|---|
| **Web apps** (React, Next.js, Vue, Svelte, Astro...) | Deploy, domain, SSL, env vars, migrations |
| **Static sites** (HTML, Hugo, Jekyll...) | Deploy, domain, SSL |
| **Mobile apps** (iOS, Android, React Native, Flutter, Expo) | Build, sign, submit to stores |
| **Desktop apps** (Electron, Tauri) | Build, sign, release, auto-update |
| **APIs / backends** (Node, Go, Python, Rust, Ruby) | Deploy, domain, SSL, migrations |
| **Browser extensions** (Chrome, Firefox, Edge) | Package, upload, manage listings |
| **CLI tools / libraries** (npm, PyPI, crates.io) | Test, version, publish |
| **Containerized apps** (Docker) | Build, push, deploy |
| **Monorepos** | Scan each sub-project, handle individually |

---

## How It Stays Up to Date

AI agents have a known weakness: stale API knowledge. Dashboard URLs move, endpoints get deprecated, auth flows change. Open Your Eyes has a hard rule:

> **The agent must fetch live documentation before guiding you through any service — even well-known ones like Stripe or Vercel.**

It never relies on training data for API specs. It always checks the current docs. This means the playbook works even as providers change their interfaces.

---

## What's Stored Where

```
~/.open-your-eyes/
├── PLAYBOOK.md          ← Agent instructions (the brain)
├── secrets.env          ← API keys (chmod 600)
├── capabilities.yaml    ← What the agent can do
├── providers/           ← Per-provider metadata
│   ├── vercel.yaml
│   ├── lima-city.yaml
│   └── ...
├── dashboard/           ← Your control panel (also your first deployed project)
├── dev-deploys.yaml     ← Active dev preview deployments
└── keys/                ← Certificate files, keystores, .p8 files
```

**Nothing goes in your project directories.** No config files. No dotfiles. Just your code.

Credentials are global — set up Stripe once, every project can use it.

## The Dashboard

After initial setup, your dashboard is live at `oye.yourdomain.com`. It shows:

- **Connected services** — which providers are configured, their health status
- **Domains** — all domains across all registrars, expiry dates
- **Deployed projects** — what's live, where, with what framework
- **Local projects** — everything in `~/code/`, detected frameworks and deploy targets
- **Dev previews** — active subdomain deployments with links
- **API keys** — which keys are stored (redacted values)

Run it locally too: `cd ~/.open-your-eyes/dashboard && npm run start` → `http://localhost:5173`

---

## License

MIT
