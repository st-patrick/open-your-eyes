# Registrar API comparison (April 2026)

Scope: full programmatic domain lifecycle (search, check, price, register, renew, DNS), cheap .de and exotic TLDs, EU-friendly, no "contact sales" enterprise-only APIs.

## Comparison table

| Registrar | API: register+renew? | Auth | Public price list | .de reg (approx) | Exotic TLDs sample | Hard gates | Reputation | Indie-friendly? |
|---|---|---|---|---|---|---|---|---|
| **Porkbun** | Yes — full (search, check, create/register, renew, DNS, nameservers, SSL, glue) via `api.porkbun.com` v3 | API key + Secret key (per account) + per-domain "API Access" toggle | Yes, fully public | ~$5.55 (~€5.20) | .xyz ~$2, .click ~$2-3, .fun ~$1.57 promo, .online ~$1-3 promo, .digital ~$3 promo, .app ~$5.99, .email ~$5 | None beyond account funding | Solid, ~10y, indie-darling, EU customers routine | **Yes — top pick** |
| **INWX** (DE/AT) | Yes — full DomRobot XML-RPC + JSON-RPC (domain.check, domain.create, domain.renew, nameserver.*) | Username/password + optional TOTP; session-based | Yes, fully public | ~€4.08 reg / €4.65 renew | .xyz ~€10-12, .click ~€8, .online ~€3 promo, .fun ~€6, .digital ~€4 promo, .email ~€10 | Prepaid account balance (top up by card/SEPA); full KYC for .de TRUSTEE if no DE address | ICANN accredited, German, very stable, popular with German devs | **Yes — best for .de-heavy** |
| **Namecheap** | Yes — full (domains.create, renew, DNS, etc.) | API key + username + **IPv4 allowlist** | Yes | ~$6 | .xyz ~$2, .click ~$3, .online ~$3, .fun ~$3, .digital ~$4, .app ~$14 | **IP allowlist mandatory** + one of: 20 domains, **$50 balance**, or $50 spend in last 2y | Huge, very stable | Workable but IP allowlist is painful for a deploy bot on dynamic infra |
| **Name.com** | Yes — v4 REST (legacy flagged "deprecated" in docs header but still live) | Username + token (Basic) | Yes | ~$9-10 | .xyz ~$12, .online ~$4, .fun ~$25, .digital ~$35, .app ~$14 | None public, but v4 marked deprecated | Stable (owned by Identity Digital) | Skip — pricier and API future uncertain |
| **OVHcloud** | Yes — Public API `/domain/*` with cart/order flow; DNS zones; renewal | Application key + secret + consumer key (3-legged OAuth-ish) | Yes, public price grid | ~€6-7 | .xyz ~€10, .click ~€11, .online ~€3 promo, .fun ~€9, .digital ~€4 promo, .app ~€14 | EU company, card OK, registration cart flow is multi-step | Massive, very stable, EU-based | OK, but API is heavy (cart/order model), pricing middling |
| **Hetzner** | **No domain registration API.** Registration is via "Domain Registration Robot" with **email-based** ordering. DNS-only REST API for zones/records (being discontinued May 2026). | DNS: token | Yes | ~€5 via email workflow | Very limited TLD list (.de/.com/.net/.org/.info/.biz/.eu only) | Not an API for registration | Extremely stable, German | **No for registration**. Fine as a secondary DNS host |
| **Gandi** | Yes — v5 REST (domains, LiveDNS), incl. create/renew/search | Personal Access Token (Bearer); old API keys deprecated | Yes | ~€16 | .xyz ~€15, .online ~€40, .fun ~€25, .digital ~€35, .app ~€18 | None hard, but EUR-denominated and **expensive** post-2023 price hike | Stable, French/EU, but reputation hit after acquisition and price hikes | Skip — too expensive for a "lots of sites" tool |
| **Legacy shared-hosting control panels** (Plesk/cPanel-class, lima-city, many regional hosts) | Typically **DNS + vhost only** — rarely expose domain order/register endpoints. Domain registration is UI-only. | Varies (API key, session) | Partial | n/a via API | n/a via API | Registration is UI-only | Stable but not register-oriented | **No** for programmatic registration; keep only as a DNS/hosting target |

Price figures are approximate April 2026 snapshots drawn from registrar pricing pages and aggregator data; always re-query the live pricing endpoint before charging a card.

## TL;DR / recommendation

- **Primary: Porkbun.** Only registrar in this set that combines (a) a genuinely complete public REST API for register/renew/DNS, (b) simple API key + secret auth with no IP allowlist or balance minimum, (c) aggressive pricing on exotic TLDs (.xyz, .click, .fun, .online, .digital, .app), and (d) free WHOIS privacy + free SSL. Remember the per-domain "API Access" toggle and that the host moved to `api.porkbun.com` in 2025.
- **Secondary for .de: INWX.** German registrar with a mature DomRobot API, ~€4.08 .de registrations (cheapest credible option), and full register/renew/DNS coverage. Prepaid balance model is a minor friction but fine for a deploy tool — top up once, spend down. Use INWX when the TLD is `.de` (or another EU ccTLD), fall back to Porkbun for everything else.
- **Avoid for introdote:** Namecheap (IP allowlist is hostile to a portable deploy tool), Gandi (too expensive post-hike), Name.com (v4 flagged deprecated, pricier), Hetzner (no registration API at all — email-only), legacy shared-host control panels (DNS-only, confirmed no register endpoints in the OpenAPI specs the agent has probed).

**Architecture suggestion:** route registration by TLD. If TLD == `.de` → INWX; else → Porkbun. Both expose check/price/register/renew/DNS, so the abstraction is a thin adapter over two drivers. Keep shared-hosting control panels as possible secondary DNS/hosting targets only, never as registrars.

## Sources

- [Porkbun API v3 documentation](https://porkbun.com/api/json/v3/documentation)
- [Porkbun KB: Getting started with the API](https://kb.porkbun.com/article/190-getting-started-with-the-porkbun-api)
- [Porkbun pricing](https://porkbun.com/products/domains)
- [INWX API page](https://www.inwx.com/en/offer/api)
- [INWX API docs](https://www.inwx.com/en/help/apidoc)
- [INWX price list](https://www.inwx.com/en/domain/pricelist)
- [Namecheap API intro](https://www.namecheap.com/support/api/intro/)
- [Namecheap API FAQ — balance/whitelist](https://www.namecheap.com/support/knowledgebase/article.aspx/9739/63/api-faq/)
- [Name.com API resources](https://www.name.com/api-resources)
- [OVHcloud order a domain (API)](https://help.ovhcloud.com/csm/en-domain-names-api-order?id=kb_article_view&sysparm_article=KB0051563)
- [OVHcloud API getting started](https://help.ovhcloud.com/csm/en-api-getting-started-ovhcloud-api?id=kb_article_view&sysparm_article=KB0042777)
- [Hetzner Domain Registration Robot](https://docs.hetzner.com/robot/domain-registration-robot/)
- [Hetzner DNS API](https://dns.hetzner.com/api-docs)
- [Gandi Public API v5](https://api.gandi.net/docs/)
