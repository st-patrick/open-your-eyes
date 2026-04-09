# Sub-playbook: Product Interest / Waitlist Starter

> How to scaffold, build, and ship a signup site for a product idea that **doesn't exist yet**. For real businesses with real offerings see `small-business-starter.md`.

---

## When to use this playbook

The project has:

- A **strong one-sentence idea** that could become a product someday
- **Nothing to deliver right now** — no product, no MVP, no beta
- A clear primary action: **capture interested people's email addresses**
- An honest relationship with the visitor: aspirational, not fraudulent

If the user can already deliver something, use `small-business-starter.md` instead.

---

## The honesty rule (hard constraint)

This is the rule that separates interest sites from vapor:

> **The mailing list IS the product. Everything else is support.**

Concretely:

- **No fake launch dates.** Use "soon", "in preparation", "coming when ready". Never a specific month or year that hasn't been decided.
- **No fake subscriber counts.** No "join 5,000 others" if there are zero.
- **No fake testimonials, no fake quotes, no fake press logos, no fake case studies.**
- **No fake "As seen in..."** unless it's literally true with a link.
- **Label sample content clearly.** If the site shows what a future newsletter issue or product screen might look like, label it "Sample" / "Mockup" / "Example". Never present it as if it already exists.
- **Never fake social proof with "coming soon" badges on features that aren't even designed yet.** A counter that reads "Issue Nº 00 · In Preparation" is the right pattern.

Every element on the page should support one action: get the right person's email address.

---

## Phase 0: Visual reference (before any design thinking)

Same rule as `small-business-starter.md` Phase 0 — see `PLAYBOOK.md` → `RULE: DESIGN FROM REFERENCES` for the full flow. Collect references via user-supplied collection or agent-hunted shortlist, write the `Atlas/design.md` brief, build against it.

**Extra guidance for product-interest sites:** these tend to look best when they lean into **one metaphor** rather than "generic landing page with hero + features + CTA." Think: a letter, a pirate radio tape, a blueprint, a synth patch sheet, a menu card. Decide the metaphor in the visual brief, not while writing HTML.

---

## Phase 1: Strip to one CTA

Interest sites should have **exactly one** primary action: capture an email. Everything else is support material. Run this filter before Phase 2:

- **One form.** Not two.
- **One field.** Email, and nothing else, unless there's a genuine need for a name.
- **One button.** Not three CTAs in different accents.
- **One page.** No `/about`, `/features`, `/pricing`, `/blog`. Everything lives on `/`.

If the agent catches itself adding a second CTA, ask: does this improve the signup rate more than it distracts from it? The answer is almost always no.

---

## Phase 2: Scaffold

Same structure as `small-business-starter.md`:

```
~/code/<project>/
├── README.md
├── index.html
├── .gitignore
└── Atlas/
    ├── README.md
    ├── design.md       ← the Phase 0 visual brief
    └── todos.md        ← (optional)
```

No build step. Ever.

---

## Phase 3: Write positioning + hero copy in plain text BEFORE any CSS

Even more important for interest sites than for small businesses. The ONE sentence in the hero is the entire product. Write it in plain text first, iterate, get user sign-off, then code. Three-sentence preview format:

```
POSITIONING:  <single-sentence pitch>
HERO LINE:    <exact headline, italics marked>
LEDE:         <2-3 sentences>
CTA LABEL:    <the one button's text>
METAPHOR:     <the visual metaphor from Phase 0>
```

---

## Phase 4: Content sections — the canonical shape

Product-interest sites are **much shorter** than small-business sites. 5-6 sections total, fitting in ~1-2 scrolls:

1. **Minimal header** — wordmark + one tiny metadata badge (issue number, version, status). "Nº 00 · In Preparation" is the canonical honest stamp.
2. **Massive hero statement** — one sentence (3-8 words), optionally two lines with italic emphasis on the second. This IS the positioning. If it can't fit in 8 words, the product idea isn't sharp enough.
3. **A short lede paragraph** — 2-3 sentences, answers "for whom" and "when does this matter".
4. **The signup form** — one email field, one button, one disclaimer line. Put it AT the hero level, not at the bottom of the page. First-scroll.
5. **"What you get / What to expect"** — 3-5 short bullets, italic titles, small numbered labels. Not features. Deliverables.
6. **Sample** (optional but high-conversion) — a single card showing what the product might look like, **explicitly labeled as a sample**.
7. **Byline / who** — one paragraph naming the humans behind this. Trust anchor.
8. **Tiny footer** — copyright, Imprint / Privacy links. Nothing else.

---

## Phase 5: Copy rules

- **The ONE sentence is everything.** Spend as long as needed on it.
- **Negation beats affirmation.** "No marketing, no funnel, no upsell" tells the reader more than "simple, clean, honest."
- **Specificity beats abstraction.** "For people who build AI" > "for everyone interested in AI."
- **Make one promise, once.** Don't repeat the CTA three times. Ask once, confidently.
- **Avoid the word "revolutionary."**
- **Avoid the word "curated."**
- **Avoid stock-photo adjectives** ("empowering", "transformative", "game-changing"). They're credibility taxes.

---

## Phase 6: Deploy

Same as `small-business-starter.md` Phase 6. Use a short memorable domain — see `domain-hunting.md`. Cheap exotic TLDs (.click, .xyz, .fun) are perfectly fine for waitlist sites; they signal "lightweight, playful" rather than "permanent commercial entity."

---

## Phase 7: Launch checklist

The product-interest launch checklist is **shorter** than for real businesses. Skip what doesn't apply:

- [ ] `<title>`, `<meta description>`, canonical, OG tags, favicon — **required**
- [ ] `/sitemap.xml` + `/robots.txt` (allow AI crawlers) — **required**
- [ ] Imprint / privacy stub pages — **required in regulated markets before any real email collection**
- [ ] Plausible snippet — **optional**, default to off for v1. If the agent adds it, tell the user.
- [ ] Organization JSON-LD — **optional**. Can skip for waitlist sites.
- [ ] Service / Product JSON-LD — **skip**. There's no product yet.
- [ ] Google Business Profile — **skip**. Not a local business.
- [ ] Regional citations — **skip**. Ditto.
- [ ] Lighthouse audit — **required**. Performance still matters.

Everything else in the Marketing & SEO playbook section (GBP, citations, content strategy) is for real businesses. Interest sites just need to be fast, honest, and findable.

---

## Phase 8: After-launch

Two checkpoints specific to interest sites:

1. **Monitor the inbox.** Every signup is a real person interested in a product that doesn't exist. Write them back within 24 hours. Even a one-line reply converts strangers into early advocates.
2. **Know when to kill it.** If <10 signups after 3 months of being live, the positioning is wrong or the idea doesn't have demand. Either rewrite the hero sentence, pivot the positioning, or shelve the site and move on. A waitlist that never becomes a product is fine; a waitlist that pretends it's going to become a product forever is not.

---

## Anti-patterns

- **"Let's add a multi-step signup funnel."** No. One field, one button.
- **"Let's add an email sequence with 5 automated emails."** No.
- **"Let's fake the subscriber count."** NEVER.
- **"Let's add a countdown to launch."** Only if there's a REAL launch date committed.
- **"Let's start a social account for it."** Not until the product exists. Founder's personal account is fine.
- **"Let's set up a full ESP provider like Mailchimp."** Not yet. Web3Forms is enough for <100 signups. Scale up when scale matters.
- **"Let's ship without saying who's behind it."** Dead on arrival. Even a waitlist needs a human anchor.
