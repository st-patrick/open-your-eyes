# Open Your Eyes — Recommended Defaults

> For users who don't have existing providers or don't have a preference. These are the agent's go-to recommendations when the user says "just pick something for me."

## The Default Stack

| Role | Provider | Why | Free Tier |
|------|----------|-----|-----------|
| **Hosting** | [Vercel](https://vercel.com) | Best deploy API, great DX, auto-SSL, preview deploys | Unlimited sites, 100GB bandwidth |
| **DNS** | [Cloudflare](https://cloudflare.com) | Best DNS API, free CDN + DDoS protection, fast propagation | Unlimited domains |
| **Domains** | [Porkbun](https://porkbun.com) | Cheapest registrar with an API, no upsells, transparent pricing | N/A (domains cost money) |
| **Database** | [Supabase](https://supabase.com) | Postgres + Auth + Storage + Edge Functions in one | 2 projects, 500MB DB, 1GB storage |
| **Payments** | [Stripe](https://stripe.com) | Industry standard API, excellent test mode | No monthly fee, pay per transaction |
| **Email** | [Resend](https://resend.com) | Modern API, great DX, easy domain verification | 100 emails/day, 3,000/month |
| **Analytics** | [PostHog](https://posthog.com) | Open-source, generous free tier, event tracking + session replay | 1M events/month |
| **Error Tracking** | [Sentry](https://sentry.io) | Industry standard, good free tier, auto source maps | 5K errors/month |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) | Already where your code lives, no extra account needed | 2,000 min/month (free repos) |

## Why These Defaults?

### Criteria

1. **Has an API** — the agent must be able to automate it
2. **Has a free tier** — the user shouldn't need to pay before seeing value
3. **Good developer experience** — clear docs, fast support, reliable uptime
4. **One account per role** — avoid service sprawl (Supabase covers DB + Auth + Storage + Functions)
5. **The agent can look up their docs** — well-documented APIs that the agent can research live

### Why Not AWS / GCP / Azure?

Too complex for the "just pick something" user. These are infrastructure platforms, not developer tools. They require IAM policies, region selection, service linking, billing alerts. The defaults above are opinionated, simple, and free to start.

### Why Not Firebase?

Firebase is excellent but locks you into Google's ecosystem. Supabase gives you standard Postgres (portable) + the same features (auth, storage, functions) without vendor lock-in.

## When to Suggest Alternatives

The defaults above are for users with **no preference**. If the user already has something that works, use what they have (see PLAYBOOK.md). Only suggest alternatives when:

- Their current provider has no API (can't automate it)
- Their current provider is missing a capability the project needs
- They explicitly ask "what would you recommend?"

## Mobile Defaults

| Role | Provider | Why |
|------|----------|-----|
| **iOS Distribution** | [App Store Connect](https://appstoreconnect.apple.com) | Only option for iOS |
| **Android Distribution** | [Google Play Console](https://play.google.com/console) | Only option for Android |
| **Push Notifications** | [Expo Push](https://expo.dev/push-notifications) | Works with Expo, no extra account if using EAS |
| **Crash Reporting** | [Sentry](https://sentry.io) | Same as web — one account for both |
| **OTA Updates** | [Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/) | If using Expo |

## Desktop Defaults

| Role | Provider | Why |
|------|----------|-----|
| **Code Signing (macOS)** | Apple Developer ID | Required for notarization |
| **Code Signing (Windows)** | SignPath or SSL.com | Cheapest code signing certs |
| **Distribution** | GitHub Releases | Free, auto-update support via electron-updater / Tauri |
| **Auto-Update** | GitHub Releases + update server | Built into Electron and Tauri |

## Package Publishing Defaults

| Registry | Provider |
|----------|----------|
| JavaScript | [npm](https://npmjs.com) |
| Python | [PyPI](https://pypi.org) |
| Rust | [crates.io](https://crates.io) |
| Ruby | [RubyGems](https://rubygems.org) |
| Go | git (no registry needed) |
