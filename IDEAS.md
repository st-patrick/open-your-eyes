# Open Your Eyes — Ideas

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
- A helper script `~/.open-your-eyes/bin/oye-exec` that sources secrets.env and runs commands
- Agent calls `oye-exec curl -H "Authorization: Bearer $VERCEL_TOKEN" ...` instead of expanding the token
- Validation script `oye-validate [provider]` that sources env internally and reports pass/fail

---
