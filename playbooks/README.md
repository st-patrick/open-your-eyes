# Introdote sub-playbooks

Core rules and the full deploy lifecycle live in `~/.introdote/PLAYBOOK.md`. This folder contains **topical sub-playbooks** — focused modules for specific workflows that would otherwise bloat the core document.

When to read what:

| About to... | Read |
|---|---|
| Ship a new small business / service site (real offering, real contact) | `small-business-starter.md` |
| Ship a new product-interest / waitlist site (nothing to deliver yet) | `product-interest-starter.md` |
| Buy a new domain (hunt candidates, check availability, pick a registrar) | `domain-hunting.md` |
| Compare domain registrars for programmatic use | `registrar-api-research.md` |

The sub-playbooks cross-reference each other and the core `PLAYBOOK.md`. They do NOT duplicate the rules from the core — they assume the core's rules are already in context: PRIME DIRECTIVE, MINIMAL BY DEFAULT, NEVER TRUST YOUR TRAINING DATA, DESIGN FROM REFERENCES, WEB3FORMS IS THE ONLY CONTACT CHANNEL, and REAL CHROME VIA CDP.

## Aesthetic family

When an operator ships multiple sites under a personal umbrella, a shared **visual family** helps them read as siblings rather than noise. But "family" is a deliberate design choice, not a default. Every new site starts with `RULE: DESIGN FROM REFERENCES` — collect visual references before writing CSS, then decide whether this new site joins an existing family or stands alone.

The mistake to avoid: the agent reaching for its most-recent palette and type scale by muscle memory. Three consecutive sites can collapse into one look because the model reuses what it just built. The Dribbble/Pinterest reference step from `RULE: DESIGN FROM REFERENCES` exists to break that drift.

If there are existing committed sites in a family, their current `index.html` files are the canonical source of truth for the shared tokens. Copy the `<style>` block from the closest-in-mood existing site and diverge from there — don't reconstruct from memory.
