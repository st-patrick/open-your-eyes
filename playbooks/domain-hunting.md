# Sub-playbook: Domain Hunting

> How to go from "we need a name" to "the domain is registered and pointing at the right folder." Shared by `small-business-starter.md` and `product-interest-starter.md`.

---

## When to use this playbook

Whenever the agent needs to register a new domain, whether for a real business site, a product-interest waitlist, or an existing site that's outgrowing its placeholder subdomain.

---

## The budget ceiling

Respect the per-project budget set in the user's capabilities (or ask if unset). A common sensible default:

- **Preferred ceiling:** ~€5/yr renewal (cheap exotic TLDs: .click, .xyz, .fun, .online, .digital)
- **Approved overage:** up to ~€8/yr for country-specific TLDs when they go to a real business (e.g. .de, .uk, .ca, .fr)
- **Any TLD over ~€10/yr:** per-domain approval with written justification

A purchase decision is **never automatic**. The agent hunts → shortlists → explains trade-offs → asks. The user picks. No purchases without explicit approval, even if the user previously said "exotic TLDs OK."

---

## Phase 1: Generate candidates

Start wide — 15-25 candidate names per project — and filter down later. Mix several angles:

1. **Literal descriptive** — high SEO, low memorability
2. **Compound words in the target language** — medium SEO, high regional signal, high memorability for native speakers
3. **Sister-brand / family** — only if there's an existing brand to riff on
4. **Fantasy / coined** (like "Google" originally) — low initial SEO, very high brand ceiling, often available in exotic TLDs for cheap
5. **Short + exotic TLD** — perfect for interest sites, cheap

For each angle, aim for 3-5 candidates. Don't be shy about including ones that feel weak — availability elimination does half the filtering.

---

## Phase 2: Check availability (use DNS, not RDAP)

**Do not use RDAP as a primary check for country-specific TLDs.** RDAP proxies (rdap.org, rdap.net) frequently return 404 (= "available") for `.de` and similar country-code TLDs that are actually registered. This will burn you. **The authoritative check is DNS**:

```bash
check_domain() {
  local d="$1"
  local soa ns
  soa=$(dig +short SOA "$d" @1.1.1.1 2>/dev/null)
  ns=$(dig +short NS "$d" @1.1.1.1 2>/dev/null)
  if [ -z "$soa" ] && [ -z "$ns" ]; then
    printf "  %-40s ✓ AVAILABLE\n" "$d"
  else
    printf "  %-40s TAKEN\n" "$d"
  fi
}
```

Why it works: a registered domain ALWAYS has at least an SOA record and NS records at its authoritative zone. A truly unregistered domain has neither. It's faster than RDAP, rate-limit-free, and authoritative.

**Caveat:** parked domains sometimes have NS + SOA but no useful content, so "TAKEN" here means "registered", not "actively used". That's the correct interpretation for availability.

---

## Phase 3: Shortlist + pricing

For each available candidate:

- **Price (first year):** often heavily discounted on exotic TLDs (€1-3 first year). Check the registrar's actual list price.
- **Price (renewal, year 2+):** THIS is the number that matters. First-year deals are loss-leaders. A domain at €1 first year / €12 renewal is NOT a "cheap" domain.
- **Trademark risk:** search the name on Google + EUIPO / USPTO. Using a name that's a well-known brand in an adjacent category is risky even if the TLD is different.
- **Regional fit:** country TLD for country-targeted projects, .com for international, exotic TLDs for lightweight/playful interest sites.
- **Memorability + typability:** can it be said once on the phone and have the other person spell it right? If not, downgrade.

Present 3-5 finalists to the user as an `AskUserQuestion` with clear trade-offs. The user picks. No purchases without explicit approval.

---

## Phase 4: Register

See `playbooks/registrar-api-research.md` for the full comparison of programmatically-usable registrars. Short version:

- **Primary: Porkbun** — full public v3 REST API, no hostile gates, aggressive pricing on exotic TLDs. Per-domain "API Access" toggle must be flipped on once per domain.
- **Secondary for .de: INWX** — mature DomRobot API, cheapest credible .de option. Prepaid balance model.
- **Ruled out:** Namecheap (IP allowlist + balance gate), Name.com (v4 deprecated), Gandi (post-hike pricing), Hetzner (no registration API at all), most legacy shared-hosts (DNS + vhost only, no register).

If the user's current registrar is not on the programmatic list, or if they deliberately want domain buying to stay manual (to feel the spend, to keep budget visible), the agent opens the registrar's order page in the browser and polls the listing endpoint until the new domain appears.

When programmatic registration credentials are added to `~/.introdote/secrets.env`:
- `PORKBUN_API_KEY` + `PORKBUN_SECRET_KEY`
- `INWX_USERNAME` + `INWX_PASSWORD` (+ `INWX_TOTP_SECRET` if 2FA)

…the hunt → buy loop becomes fully automatable up to the `user approves specific name` step, which should always stay explicit.

---

## Phase 5: Post-registration setup

Once a domain is registered, the setup varies by hosting target. Common patterns:

### Shared hosting with an auto-created default vhost

Many shared hosts (lima-city, Plesk-based, cPanel-based) automatically create a default vhost at domain registration time, pointing the new hostname at a placeholder folder. The agent should **update** the existing vhost to point at the target project folder, not create a new one. The exact API shape varies — see `PLAYBOOK.md` → `CREATE SUBDOMAIN` for the discovery process. A 400 error with field-level validation messages means the route exists and the body is wrong; read the error to infer required fields.

### Edge platforms (Vercel, Netlify, Cloudflare Pages)

1. Add the domain to the project (via CLI or API).
2. Create a CNAME record at the DNS provider pointing the hostname at the platform's edge.
3. Wait for DNS to propagate, then verify HTTPS.
4. If the Let's Encrypt cert isn't minted automatically within ~60s (symptom: `SSL_ERROR_SYSCALL` on TLS handshake), force it via the platform's cert-issue command.

### Self-hosted (VPS + nginx/caddy)

Out of scope for most small-site projects. If the agent ends up here, it probably escalated prematurely.

### Post-setup verification

Always verify HTTPS from a real Chrome instance (via CDP) rather than curl. macOS DNS cache can lie to curl for TTL minutes after a DNS change, making the deploy look broken when it's actually fine. Chrome launches with its own resolver and will see the current state.

---

## Anti-patterns

- **Trusting RDAP for country TLDs.** It lies. Always DNS-check.
- **Buying on "first year €1" without checking renewal price.** €1 → €12/yr renewal is a €12 domain with a €11 marketing subsidy.
- **Buying a name because it sounds cool, without checking for trademarks.** Do the 30-second search.
- **Over-budget purchases without explicit approval.** Even if the user previously said "exotic TLDs up to €5," a €7.99 country-TLD is an overage and needs a per-domain yes.
- **Hyphenated ugly URLs when a compound works.** Try the compound first.
- **Buying a domain BEFORE the site is built.** Build the site locally, preview via CDP Chrome, let the user react. Then hunt + buy. A bad site with a perfect domain is a waste of the renewal fee.
