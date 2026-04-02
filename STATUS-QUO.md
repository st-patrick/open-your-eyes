# Auto-Deploy Agent Playbook - Status Quo

## What exists

- `PLAN.md` — New plan: agent playbook that walks users through collecting all credentials for full auto-deploy
- Empty project directory at `~/code/lovable2/`

## What changed

Pivoted from "drop-in kit of service blueprints" to a **conversational agent playbook**. Instead of static docs per service, we're writing a single script that Claude follows to interactively onboard a user — asking questions, linking to exact dashboard pages, validating keys via API calls, and storing everything securely.

## What's next

Build `PLAYBOOK.md` — the master agent script, starting with Tier 1:
1. Intro/assessment (what does the user already have?)
2. Vercel setup (hosting)
3. Cloudflare setup (DNS)
4. Porkbun setup (domain registration)
5. Validation Gate 1 (deploy hello-world to a custom domain)
6. Credential storage (`~/.lovable/secrets.env`)

Then extend with Tier 2 (Supabase, Stripe) and Tier 3 (Resend, PostHog, Sentry).
