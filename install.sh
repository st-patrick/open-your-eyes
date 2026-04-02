#!/bin/bash
# Introdote — Global Install
# Sets up ~/.introdote/ as the global agent capability store

set -e

INTRODOTE_DIR="$HOME/.introdote"

echo "Installing Introdote → $INTRODOTE_DIR"
echo ""

# Create directory structure
mkdir -p "$INTRODOTE_DIR/providers"
mkdir -p "$INTRODOTE_DIR/keys"

# Copy playbook
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SCRIPT_DIR/PLAYBOOK.md" "$INTRODOTE_DIR/PLAYBOOK.md"

# Create secrets.env if it doesn't exist (don't overwrite!)
if [ ! -f "$INTRODOTE_DIR/secrets.env" ]; then
    touch "$INTRODOTE_DIR/secrets.env"
    chmod 600 "$INTRODOTE_DIR/secrets.env"
    echo "  Created secrets.env"
else
    echo "  secrets.env already exists (not overwritten)"
fi

# Create capabilities.yaml if it doesn't exist
if [ ! -f "$INTRODOTE_DIR/capabilities.yaml" ]; then
    cat > "$INTRODOTE_DIR/capabilities.yaml" << 'EOF'
# Introdote — Capabilities
# Auto-updated as providers are configured.
# Tells the agent what it can do across all projects.
EOF
    echo "  Created capabilities.yaml"
else
    echo "  capabilities.yaml already exists (not overwritten)"
fi

# Global gitignore — never commit ~/.introdote/ contents
GITIGNORE_GLOBAL="$HOME/.gitignore_global"
if ! grep -qxF '.introdote/' "$GITIGNORE_GLOBAL" 2>/dev/null; then
    echo ".introdote/" >> "$GITIGNORE_GLOBAL"
    git config --global core.excludesFile "$GITIGNORE_GLOBAL"
    echo "  Added .introdote/ to global gitignore"
fi

# Add to CLAUDE.md if Claude Code is installed
CLAUDE_MD="$HOME/.claude/CLAUDE.md"
if [ -d "$HOME/.claude" ]; then
    if ! grep -q "introdote" "$CLAUDE_MD" 2>/dev/null; then
        cat >> "$CLAUDE_MD" << 'EOF'

## Introdote

When I say "finish", "ship it", "deploy", or "open your eyes":
1. Read ~/.introdote/PLAYBOOK.md and follow its instructions
2. Scan the current project, check global capabilities, fill gaps, and ship

When I say "preview this", "dev deploy", or "push to dev":
1. Read ~/.introdote/PLAYBOOK.md — follow the "preview this" section
2. Deploy to a dev subdomain for quick iteration
EOF
        echo "  Added skill trigger to ~/.claude/CLAUDE.md"
    else
        echo "  ~/.claude/CLAUDE.md already has introdote entry"
    fi
else
    echo "  Claude Code not detected — skipping CLAUDE.md integration"
    echo "  To add manually, put this in your AI agent's global config:"
    echo "    When I say 'finish' or 'open your eyes': read ~/.introdote/PLAYBOOK.md"
fi

# Copy dashboard (without node_modules — they need to be installed fresh)
if [ -d "$SCRIPT_DIR/dashboard" ]; then
    rsync -a --exclude='node_modules' --exclude='dist' "$SCRIPT_DIR/dashboard/" "$INTRODOTE_DIR/dashboard/"
    echo "  Installed dashboard"
    echo "  Run: cd $INTRODOTE_DIR/dashboard && npm install"
fi

echo ""
echo "Done! Introdote is installed."
echo ""
echo "Usage: In any project, tell your AI agent:"
echo "  \"finish\"       — ship to production"
echo "  \"preview this\" — deploy to dev subdomain"
echo "  \"open your eyes\" — initial setup"
echo ""
echo "Dashboard:"
echo "  cd ~/.introdote/dashboard && npm install && npm run start"
echo "  → http://localhost:5173"
echo ""
echo "First time? The agent will walk you through setting up your providers."
echo "After that, it works automatically for every project."
