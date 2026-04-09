# Sub-playbook: Small Business Starter

> How to scaffold, build, and ship a site for a real small business (real offering, real money at stake). For waitlist / "idea" sites see `product-interest-starter.md`.

---

## When to use this playbook

The project has:

- A **real thing** the operator can deliver (subscription box, bootcamp, audit, workshop, event series, dropshipped goods, consulting engagement)
- A **real price** or at least a real range
- A **real person** who will answer inquiries
- A need to be **findable** (SEO, regional citations, eventually Google Business Profile)

If any of those are missing, this is probably a product-interest / waitlist site — use `product-interest-starter.md` instead.

---

## Phase 0: Visual reference (before any design thinking)

**Do this before Phase 1.** Before writing any CSS, collect 3-6 visual references. See `~/.introdote/PLAYBOOK.md` → `RULE: DESIGN FROM REFERENCES, NOT FROM MEMORY` for the full flow. Summary:

1. Ask the user for a Dribbble collection / Pinterest board / mood board. If yes, fetch + extract palette + type + mood → write `Atlas/design.md` brief.
2. Otherwise ask "what should this site feel like in three words?" → WebSearch Dribbble / Behance / Awwwards / SiteInspire / MinimalGallery / Land-book → bring back 5-7 shots → let the user pick 2-3 → write the brief.
3. Option C (reuse an existing site family) is valid but should be deliberate, not a lazy fallback.

`Atlas/design.md` is a 5-line brief. Build against it, not against memory. See the rule in `PLAYBOOK.md` for the exact format.

---

## Phase 1: Scope check (before any code)

Ask these questions before opening an editor. Some are for the user, some are for the agent.

**About the offering:**
1. What's the one-sentence pitch? If the agent can't write it, the site can't sell it.
2. What's the price? Even a fuzzy range is enough.
3. What delivers the first unit of value? A meeting? A ticket? A parcel? A call?
4. Is there existing infrastructure (a calendar, a POS, a Stripe account, a warehouse)? Or is this a cold start?
5. **Can the user actually deliver this personally?** Ask this specifically. Do not assume.

**About the brand:**
1. Does the offering live inside an existing brand family or is it its own thing? (Answer informs Phase 0 option C vs A/B.)
2. Pick a coherent palette and type system based on Phase 0 references *before* writing HTML. No freestyle.

**About the contact flow:**
1. Web3Forms with the shared access key. Always. No exceptions (see `PLAYBOOK.md` → `RULE: WEB3FORMS IS THE ONLY CONTACT CHANNEL`).
2. Subject line must be `"New inquiry · <SITE NAME>"` or similar — the user triages the shared inbox by subject.

---

## Phase 2: Scaffold

```
~/code/<project>/
├── README.md           ← 1 paragraph + URL
├── index.html          ← the whole site, inline CSS + JS
├── .gitignore
└── Atlas/
    ├── README.md       ← context, project rules, deploy recipe
    ├── design.md       ← the Phase 0 visual brief
    └── todos.md        ← open work (optional)
```

No build step. Never introduce one for a marketing site. If tempted to add Vite or Next.js, reread `MINIMAL BY DEFAULT`.

---

## Phase 3: Write positioning + hero copy in plain text BEFORE any CSS

This is the efficiency gain that prevents throwing away a finished site. Before writing a single line of HTML:

1. Write a 2-paragraph plain text preview containing:
   - The one-sentence pitch (verbatim, as it'll appear in the hero headline)
   - The section titles (§ I, § II, ...) in order
   - The hero lede (3 sentences max, plain prose)
   - The primary CTA label
2. Share it with the user for a quick sanity check.
3. Iterate on positioning in plain text — it's 10× cheaper than rewriting CSS.
4. Only after the user signs off on the positioning, start writing HTML.

A two-minute course correction at this stage saves an hour of "the headline's wrong, start over."

---

## Phase 4: Content sections — the canonical shape

Most small-business sites have this structure. Deviate only with a reason.

1. **Nav** — minimal, wordmark left, technical metadata right (location, date, seat count — whatever's true about the business)
2. **Hero** — one big statement (3-5 words max on the main line) + a short lede paragraph + one primary CTA button + one ghost secondary link
3. **Trust band / credentials** — a single strip with 4-5 italic phrases separated by dots. Fast social proof before anyone has testimonials.
4. **Services / offerings** — a list (2-4 items) with numerals, titles, short descriptions, and tiny technical meta labels. For bootcamps: curriculum modules. For consultancies: practice areas. For subscriptions: product tiers.
5. **Process / how we work** — 3-5 numbered steps. This is the section that closes skeptical buyers.
6. **Ethos / why us** — a pull quote + 3-4 principle cards. No fake testimonials. State your values in your own words.
7. **Dates / logistics** *(if time-bound)* — cohort dates, schedule table, venue info. Use "soon" / "by request" / "in preparation" — **never fake dates**.
8. **Contact** — 2-column grid: address block on the left, Web3Forms form on the right. Include a note explicitly saying "Your data stays with us. No resale."
9. **Footer** — hairline, tiny copyright, Imprint + Privacy links (stub pages OK at first; real before any real commercial activity)

---

## Phase 5: Copy rules

- **Match the market.** Write in the primary language of the target audience.
- **Right formality for the market.** Some cultures expect formal address; some expect casual. Guess wrong and you lose credibility.
- **Compound words and specific terms over jargon.** "Document intelligence for archives" beats "AI-powered document search."
- **No em-dashes in body copy.** Use en-dashes or commas.
- **No "revolutionary" / "disruptive" / "game-changing".** Every buzzword is a credibility tax.
- **Say what it's NOT.** "No slides. No cloud requirement. No marketing." — negation is high-signal.
- **Honor the price.** If you publish a number, don't hedge it.

---

## Phase 6: Deploy

Follow the flow for the configured deploy provider in `~/.introdote/capabilities.yaml`. The agent reads `deploy.provider` and acts via that provider's API or CLI.

Common patterns:

```bash
# Example: static site to a shared-hosting FTP target (provider-neutral)
source ~/.introdote/secrets.env
cd ~/code/<project>
lftp -c "
  set ftp:ssl-force true
  set ssl:verify-certificate no
  open -u \$FTP_USER,\$FTP_PASS ftp://\$FTP_HOST
  mirror -R --delete \
    --exclude-glob Atlas/ \
    --exclude-glob .git* \
    --exclude-glob README.md \
    --exclude-glob .DS_Store \
    . /<folder-name>
"

# Example: edge platform (Vercel/Netlify/etc.) via CLI
# cd ~/code/<project> && <platform> deploy --prod --yes

# Verify HTTPS from real Chrome (macOS DNS cache can lie to curl)
cd ~/code/introdote/dashboard
node shot.mjs https://<YOUR-DOMAIN>/ /tmp/verify.png
# Inspect /tmp/verify.png — if it's the site, it's done
```

For subdomain creation (DNS + vhost mapping + cert), see `PLAYBOOK.md` → `CREATE SUBDOMAIN`. Some hosts auto-create a default vhost at domain registration that needs to be UPDATED to point at the target folder (not re-created). The agent should read the host's API error messages carefully — a 400 with validation errors means the route exists and the body is wrong, not that the endpoint is missing.

---

## Phase 7: Launch checklist (from `PLAYBOOK.md` → Marketing & SEO)

Before reporting "shipped":

- [ ] `<title>` 50-60 chars, format `<Keyword> | <Brand>` or `<Service> in <City> | <Brand>`
- [ ] `<meta name="description">` 140-160 chars, unique per page
- [ ] `<link rel="canonical">` absolute URL
- [ ] `<meta name="robots" content="index,follow">`
- [ ] `<html lang="...">`
- [ ] `og:title` + `og:description` + `og:image` (1200×630) + `og:url` + `twitter:card`
- [ ] Favicon + `apple-touch-icon` + `theme-color`
- [ ] Organization / ProfessionalService JSON-LD block
- [ ] Service JSON-LD for each offering
- [ ] Person JSON-LD for the founder (if named)
- [ ] FAQPage JSON-LD if there's Q&A content
- [ ] `/sitemap.xml` listing every real URL with honest `lastmod`
- [ ] `/robots.txt` pointing at sitemap, allowing all, **not blocking GPTBot/ClaudeBot/PerplexityBot**
- [ ] Imprint + privacy stub pages (real before any real commercial activity)
- [ ] Lighthouse audit, fix any red Core Web Vitals
- [ ] Real Chrome CDP screenshot for visual QA

After launch:

- [ ] Offer Google Business Profile registration to the user
- [ ] Offer Plausible (never GA4 in the EU)
- [ ] Offer submission to country-specific tier-1 business directories
- [ ] Offer to draft a founder social post for the launch

---

## Phase 8: Handoff files

Every new small-business project gets:

1. **Atlas/README.md** — what it is, project rules, file structure, deploy commands, open work
2. **Atlas/design.md** — the Phase 0 visual brief
3. **Atlas/todos.md** (if there are more than ~5 items) — punch list for the next agent, grouped by priority, with `[x] done` checkboxes

---

## Anti-patterns (things that should make the agent stop)

- **"Let's add a CMS."** No. Edit `index.html`.
- **"Let's add a database for leads."** No. Web3Forms.
- **"Let's add a blog."** Only if the user commits to a real cadence (4+ real posts lined up). Empty `/blog` last-updated 9 months ago is a credibility loss.
- **"Let's set up per-site email addresses."** Violates `RULE: WEB3FORMS IS THE ONLY CONTACT CHANNEL`.
- **"Let's add a cookie banner."** Not needed without GA4. Plausible is GDPR-by-default.
- **"Let's duplicate an existing site and change colors."** Partial reuse is fine when intended (Phase 0 option C), but resist making everything a recolored twin.
- **"Let's fake a first cohort date."** NEVER. Aspirational is fine, fraudulent is not.
