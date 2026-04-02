# Introdote — Ideas

Ideas that aren't ready to implement yet but are worth keeping.

---

## Dashboard as Prompt Interface

The dashboard could include an admin-only input panel — like Lovable's prompt bar — where you type what you want and it reaches the AI agent. The visual output (your deployed site) and the prompt input live in the same place.

Challenges to solve:
- How does the dashboard talk to the agent? (Claude Code runs in a terminal, not a web server)
- Could use a bash script that the agent polls in the background
- Or a WebSocket bridge between the dashboard and a running Claude Code session
- Or the dashboard writes to a file that a Claude Code hook picks up
- Security: must be admin-only, not exposed to the public

The vision: you're looking at your deployed site, you type "add a contact form", the agent builds it, and the page updates in front of you. Lovable but local.

---

## Opaque Key References (agent never sees raw secrets)

The agent should never read actual API key values. Instead, it only knows constant names (like `VERCEL_TOKEN`) and uses them by reference:
- `secrets.env` is written to by the credential collection flow but never `cat`'d or read back
- When the agent needs to use a key, it sources the env file or passes the var name to a script
- Validation calls use `$VERCEL_TOKEN` (shell expansion), not the literal value
- The key value never appears in the conversation context / LLM token window

Benefits:
- Keys can't leak through conversation history or context compression
- Keys can't be accidentally logged or echoed
- The agent works with references, not secrets — like a proper secrets manager
- Could extend to use OS keychain (macOS Keychain, Linux secret-tool) instead of a flat file

Implementation approach:
- A helper script `~/.introdote/bin/oye-exec` that sources secrets.env and runs commands
- Agent calls `oye-exec curl -H "Authorization: Bearer $VERCEL_TOKEN" ...` instead of expanding the token
- Validation script `oye-validate [provider]` that sources env internally and reports pass/fail

---

## Zero-Friction Publishing: Build → Deploy → Tell the World

The real vision isn't a deployment pipeline — it's removing ALL friction from publishing things. "finish" should mean:

1. **Deploy** — the site/app/game goes live (already built)
2. **Announce** — the agent immediately helps you tell people about it:
   - Opens the relevant Reddit community with a post template ready to copy
   - Drafts a tweet/X post with screenshots and link
   - Drafts a Show HN post
   - Creates a Product Hunt draft
   - Generates a blog post for your personal site
   - Prepares an email to your list (if you have one)

The agent should know WHAT you built (from scanning the code) and WHERE to announce it (from the project type):
- Game → r/WebGames, r/IndieGaming, itch.io
- Developer tool → r/Programming, Hacker News, Dev.to
- SaaS → r/SaaS, Product Hunt, Indie Hackers
- Mobile app → r/AndroidDev or r/iOSProgramming, App Store optimization
- Desktop app → relevant subreddit, GitHub Releases

For each channel, the agent:
- Opens the submission page in the browser
- Pre-fills or copies the title, description, and link to clipboard
- Generates screenshots/OG images if needed
- The human just reviews and clicks "Post"

This extends the prime directive: **human approves, agent does everything else** — including marketing.

Could also integrate with social media APIs (Twitter/X API, Reddit API) to post directly with human approval, but opening tabs with templates is the zero-dependency version.

---

## Full In-Browser Lovable (2 API keys = complete platform)

The core insight: a full-access webhost API key (like lima-city) + an Anthropic API key = your own Lovable running entirely in the browser.

**What the webhost API key provides:**
- Deploy (FTP upload to directories)
- Subdomains (create vhost → directory mappings)
- DNS (CRUD records for any domain)
- Databases (create/manage MySQL)
- Email (mailboxes, aliases, forwarding)
- Cron jobs
- SSL (automatic)

**What the Anthropic API key adds:**
- Code generation from natural language prompts
- The "brain" that turns "build me X" into actual files

**The dashboard becomes:**
1. User types: "Build me a landing page for my photography portfolio"
2. Dashboard calls Claude API → generates HTML/CSS/JS
3. Dashboard calls webhost FTP API → uploads files to a directory
4. Dashboard calls webhost vhost API → creates photos.yourdomain.com
5. Dashboard calls DNS API → points subdomain at hosting
6. Site is live in seconds
7. User sees it in a preview iframe
8. "Edit" button → back to prompting, iterative refinement
9. "Share" button → announcement flow (Reddit, HN, Twitter templates)

**Architecture:**
- Frontend: React dashboard (already built)
- Backend: just API calls — no server needed, everything runs client-side
  - Anthropic API: called directly from browser (user's own key)
  - Webhost API: called directly from browser (user's own key)
  - No intermediate server, no data leaves the browser except to those two APIs

**What this means for others:**
- Anyone with a webhost that has an API (lima-city, Hetzner, etc.) can run this
- For users without a webhost API, use the DEFAULTS.md stack (Vercel + Cloudflare)
- The Anthropic key is the only "subscription" — pay per use, no platform fee
- Unlike Lovable: no vendor lock-in, your own domains, your own hosting, your own data

**Why this beats Lovable:**
- No monthly subscription — just API usage costs
- Your own domains, not lovable.app subdomains
- Your own hosting, not locked to their infrastructure
- Full control over databases, email, DNS
- Can use any webhost, not just one platform
- The agent playbook (PLAYBOOK.md) means any AI agent can drive it, not just one company's product

---
