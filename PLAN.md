# Open Your Eyes — Plan

## Vision

A local-first alternative to Lovable. Three layers:

1. **The Playbook** — a global agent skill in `~/.open-your-eyes/`. Say "finish" in any project, the agent ships it. Say "preview this", it deploys to a dev subdomain. Provider-agnostic, always fetches live API docs.

2. **The Dashboard** — a local web app that shows your domains, projects, connected services, and dev previews at a glance. The control panel for everything the playbook manages.

3. **The Agent** — the AI that does the actual work. The human approves, logs in, and pays. The agent does everything else.

## Architecture

```
~/.open-your-eyes/
├── PLAYBOOK.md           ← Agent brain (skill instructions)
├── secrets.env           ← All API keys (chmod 600)
├── capabilities.yaml     ← What the agent can do
├── providers/            ← Per-provider metadata + validation state
├── projects/             ← Per-project state (deploy targets, last deploy, etc.)
├── dev-deploys.yaml      ← Active dev preview deployments
├── keys/                 ← Certificates, keystores, .p8 files
└── dashboard/            ← Local web app (serves on localhost)

~/any-project/            ← Your code (nothing from us goes here)
```

## The Dashboard

A local web app (Next.js or plain HTML+JS) that reads `~/.open-your-eyes/` and calls provider APIs to show live state.

### Views

**Services** — connected providers with health status
```
┌────────────────────────────────────────────────┐
│ CONNECTED SERVICES                             │
├────────────┬──────────┬───────────┬────────────┤
│ Vercel     │ Hosting  │ ✓ Active  │ 3 projects │
│ lima-city  │ DNS/Mail │ ✓ Active  │ 1 domain   │
│ Supabase   │ Database │ ✗ Not set │ —          │
│ Stripe     │ Payments │ ✗ Not set │ —          │
└────────────┴──────────┴───────────┴────────────┘
[+ Add Service]
```

**Domains** — all domains across all registrars
```
┌──────────────────────────────────────────────────────────┐
│ DOMAINS                                                  │
├────────────────────────┬───────────┬──────────┬──────────┤
│ blackforest-interiors.de│ lima-city │ → Vercel │ 364 days │
│ patrickreinbold.com    │ porkbun   │ → dev    │ 200 days │
└────────────────────────┴───────────┴──────────┴──────────┘
[+ Buy Domain]
```

**Projects** — all deployed projects
```
┌──────────────────────────────────────────────────────────────┐
│ PROJECTS                                                     │
├──────────────────────┬────────────────────────┬──────────────┤
│ interior-design      │ blackforest-interiors.de│ ✓ Live      │
│ experiment           │ exp.patrickreinbold.com │ dev preview  │
│ my-saas              │ —                      │ not deployed │
└──────────────────────┴────────────────────────┴──────────────┘
[Deploy] [Preview] [Open]
```

**Dev Previews** — active subdomain deployments
```
┌────────────────────────────────────────────────────────────┐
│ DEV PREVIEWS (*.patrickreinbold.com)                      │
├──────────────────┬─────────────────────────┬──────────────┤
│ experiment       │ experiment.patrickreinbold.com │ 2h ago │
│ my-cool-app      │ my-cool-app.patrickreinbold.com│ 1d ago │
└──────────────────┴─────────────────────────┴──────────────┘
[Tear Down] [Redeploy] [Open]
```

### Data Source

The dashboard reads from:
- `~/.open-your-eyes/capabilities.yaml` — what's connected
- `~/.open-your-eyes/providers/*.yaml` — provider details
- `~/.open-your-eyes/dev-deploys.yaml` — active previews
- **Live API calls** to providers for real-time status (Vercel projects, domain expiry, etc.)

### Implementation

- Runs on `localhost:3333` (or similar)
- Can be a Next.js app, a Vite SPA, or even plain HTML + a tiny Node server
- Reads local files, makes API calls to providers using stored credentials
- Actions (deploy, tear down, add service) call the agent or APIs directly

## Principles

1. **Human does 3 things**: approve, log in, pay. Everything else is the agent's job.
2. **Never trust training data for APIs**: always fetch live docs.
3. **Provider-agnostic**: works with whatever the user already uses.
4. **Set up once**: credentials are global, shared across all projects.
5. **Code-first discovery**: scan the project before asking questions.
6. **Think in user flows**: gaps are broken experiences, not missing services.
7. **Beyond deploy**: SEO, legal, performance, analytics, app stores, social.

## What's Built

- `PLAYBOOK.md` — the complete agent skill (prime directives, scan logic, credential protocol, deploy + preview flow, launch checklist)
- `install.sh` — one-command global install
- `README.md` — GitHub-ready docs with full walkthrough

## What's Next

- [ ] Dashboard scaffold (local web app reading ~/.open-your-eyes/)
- [ ] First real setup: Patrick's stack (Vercel, lima-city, patrickreinbold.com dev domain)
- [ ] Dev environment: wildcard DNS on patrickreinbold.com, FTP deploy to lima-city
- [ ] Provider research: lima-city REST API for DNS + FTP deploy
