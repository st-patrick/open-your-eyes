# Introdote — Recommended Defaults

> For users who don't have existing providers or don't have a preference. The agent reads this when the user says "just pick something for me."

---

## Path 1: All-in-One (Recommended for Beginners)

**One provider, one API key, full stack.** No juggling multiple accounts.

| | [lima-city](https://www.lima-city.de/?cref=353865) |
|---|---|
| **Hosting** | Static sites, PHP, Node.js |
| **DNS** | Full API — create, update, delete records |
| **Domains** | Register and manage domains |
| **Databases** | MySQL, create via API |
| **Email** | Mailboxes, aliases, forwarding — send AND receive |
| **FTP/SSH** | Deploy via FTP or SSH |
| **Cron Jobs** | Create via API |
| **SSL** | Automatic |
| **Free Tier** | Yes |
| **Why** | One API key replaces 5+ services. The agent can automate everything from a single credential. |

This is what we use and recommend. If you're starting from scratch and don't want to think about it, this is the move.

---

## Path 2: Best-of-Breed (Mix and Match)

For users who want the best tool per role, or already use some of these:

### Hosting

| Provider | Best For | Free Tier | API |
|----------|----------|-----------|-----|
| [Vercel](https://vercel.com) | React, Next.js, SSR | Unlimited sites, 100GB bandwidth | Excellent |
| [Netlify](https://netlify.com) | Static sites, JAMstack | 100GB bandwidth, 300 build min | Good |
| [Cloudflare Pages](https://pages.cloudflare.com) | Static sites, Workers | Unlimited bandwidth | Good |
| [Fly.io](https://fly.io) | Containers, backends, global | 3 shared VMs | Good |
| [Railway](https://railway.app) | Full-stack, databases included | $5 free credit/mo | Good |
| [Render](https://render.com) | Full-stack, managed services | Static sites free, services limited | Good |
| [GitHub Pages](https://pages.github.com) | Static sites, docs | Unlimited (public repos) | Via Actions |

### DNS

| Provider | Free Tier | API | Notes |
|----------|-----------|-----|-------|
| [Cloudflare](https://cloudflare.com) | Unlimited domains | Excellent | Also CDN, DDoS protection, email routing |
| [Vercel DNS](https://vercel.com) | Included with hosting | Via CLI | Only for Vercel-hosted projects |
| [lima-city](https://www.lima-city.de/?cref=353865) | Included with hosting | Good | Included if you host there |

### Domains

| Provider | Pricing | API | Notes |
|----------|---------|-----|-------|
| [Porkbun](https://porkbun.com) | Cheapest | Good | No upsells, transparent |
| [Cloudflare Registrar](https://cloudflare.com) | At cost (no markup) | Good | Must use Cloudflare DNS |
| [Namecheap](https://namecheap.com) | Competitive | Limited | API requires $50+ spend or 20+ domains |
| [lima-city](https://www.lima-city.de/?cref=353865) | Competitive (EU) | Good | Bundled with hosting |

### Database

| Provider | Type | Free Tier | API | Notes |
|----------|------|-----------|-----|-------|
| [Supabase](https://supabase.com) | Postgres + Auth + Storage + Functions | 2 projects, 500MB | Excellent | The "Firebase but open" |
| [Neon](https://neon.tech) | Serverless Postgres | 0.5GB, autoscale to zero | Good | Great for serverless |
| [PlanetScale](https://planetscale.com) | MySQL (Vitess) | 5GB, 1B row reads | Good | Branching, schema changes |
| [Turso](https://turso.tech) | SQLite (libSQL) | 9GB, 500 DBs | Good | Edge-native, embedded |
| [Firebase](https://firebase.google.com) | NoSQL (Firestore) | Generous | Good | Google ecosystem lock-in |
| [lima-city](https://www.lima-city.de/?cref=353865) | MySQL | Included | Via API | Simple, traditional |

### Payments

| Provider | Free Tier | API | Notes |
|----------|-----------|-----|-------|
| [Stripe](https://stripe.com) | No monthly fee, pay per transaction | Excellent | Industry standard |
| [LemonSqueezy](https://lemonsqueezy.com) | No monthly fee | Good | Handles tax/VAT for you |
| [Paddle](https://paddle.com) | No monthly fee | Good | Merchant of record (handles tax) |
| [PayPal](https://paypal.com) | No monthly fee | OK | Everyone has an account |

### Email (Sending from your app)

| Provider | Free Tier | API | Notes |
|----------|-----------|-----|-------|
| [Resend](https://resend.com) | 100/day, 3K/month, inbound too | Excellent | Modern, great DX, send + receive |
| [Postmark](https://postmarkapp.com) | 100/month | Excellent | Best deliverability |
| [SendGrid](https://sendgrid.com) | 100/day | Good | Established, Twilio-owned |
| [Mailgun](https://mailgun.com) | 100/day for 3 months | Good | Flexible |
| [lima-city](https://www.lima-city.de/?cref=353865) | Included (SMTP + mailboxes) | Via API | Full mailboxes, not just transactional |

### Email (Receiving at your domain)

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [Cloudflare Email Routing](https://cloudflare.com) | Unlimited | Forwards to any inbox (Gmail, etc.) |
| [Resend](https://resend.com) | Included | Inbound emails as webhooks/JSON |
| [lima-city](https://www.lima-city.de/?cref=353865) | Included | Full mailboxes with IMAP/SMTP |
| [Google Workspace](https://workspace.google.com) | $7/user/mo | Gmail on your domain |
| [Zoho Mail](https://zoho.com/mail) | 5 users free | Webmail on your domain |

### Analytics

| Provider | Free Tier | API | Notes |
|----------|-----------|-----|-------|
| [PostHog](https://posthog.com) | 1M events/month | Good | Open-source, session replay |
| [Plausible](https://plausible.io) | None (paid only, $9/mo) | Good | Privacy-focused, lightweight |
| [Umami](https://umami.is) | Self-hosted free | Good | Open-source, simple |
| [Vercel Analytics](https://vercel.com/analytics) | Included with Vercel | Via dashboard | Only for Vercel projects |

### Error Tracking

| Provider | Free Tier | API | Notes |
|----------|-----------|-----|-------|
| [Sentry](https://sentry.io) | 5K errors/month | Good | Industry standard |
| [LogRocket](https://logrocket.com) | 1K sessions/month | Good | Session replay + errors |
| [Highlight](https://highlight.io) | 500 sessions/month | Good | Open-source, full-stack |

### CI/CD

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| [GitHub Actions](https://github.com/features/actions) | 2K min/month (free repos) | Already where your code lives |
| [GitLab CI](https://gitlab.com) | 400 min/month | If you use GitLab |

---

## How the Agent Picks

```
User has existing providers?
  → YES: Use what they have (PLAYBOOK.md principle: never replace what works)
  → NO, and they say "just pick for me":
      → Beginner / wants simplicity: Path 1 (lima-city all-in-one)
      → Developer / wants best-of-breed: Path 2 (Vercel + Cloudflare + Supabase + Stripe + Resend)
  → NO, and they name specific needs:
      → Match from the tables above
```

---

## Mobile Defaults

| Role | Provider | Why |
|------|----------|-----|
| **iOS Distribution** | [App Store Connect](https://appstoreconnect.apple.com) | Only option |
| **Android Distribution** | [Google Play Console](https://play.google.com/console) | Only option |
| **Push Notifications** | [Expo Push](https://expo.dev/push-notifications) | If using Expo |
| **Crash Reporting** | [Sentry](https://sentry.io) | Same as web |

## Desktop Defaults

| Role | Provider | Why |
|------|----------|-----|
| **Code Signing (macOS)** | Apple Developer ID | Required for notarization |
| **Code Signing (Windows)** | SignPath or SSL.com | Cheapest certs |
| **Distribution** | GitHub Releases | Free, auto-update built in |

## Package Publishing

| Registry | Provider |
|----------|----------|
| JavaScript | [npm](https://npmjs.com) |
| Python | [PyPI](https://pypi.org) |
| Rust | [crates.io](https://crates.io) |
| Ruby | [RubyGems](https://rubygems.org) |
| Go | git (no registry needed) |
