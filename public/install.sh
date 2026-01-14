#!/bin/bash
#
# QUAD Hook Installer
# ====================
# Sets up QUAD hooks for Claude Code
#
# Usage: curl -fsSL https://downloads.quadframe.work/install.sh | bash
#
# Copyright (c) 2026 Gopi Suman Addanke. All Rights Reserved.

set -e

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     QUAD - Quick Unified Agentic Dev      ║"
echo "  ║     Hook Installer for Claude Code        ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# Configuration
QUAD_DIR="$HOME/.quad"
QUAD_HOOK="$QUAD_DIR/quad-context-hook.py"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
API_URL="${QUAD_API_URL:-https://api.quadframe.work}"
DOWNLOAD_BASE="https://downloads.quadframe.work"

# Check if Claude Code is installed
if [ ! -d "$HOME/.claude" ]; then
    echo "  ✗ Error: Claude Code not installed!"
    echo ""
    echo "  Please install Claude Code first:"
    echo "    npm install -g @anthropic-ai/claude-code"
    echo ""
    echo "  Then run this installer again."
    exit 1
fi

# Create QUAD directory
echo "→ Creating QUAD directory..."
mkdir -p "$QUAD_DIR"

# Download hook script
echo "→ Downloading QUAD hook from quadframe.work..."
curl -fsSL "$DOWNLOAD_BASE/quad-context-hook.py" -o "$QUAD_HOOK"
chmod +x "$QUAD_HOOK"

# Create config
echo "→ Creating config..."
cat > "$QUAD_DIR/config.json" << EOF
{
  "api_url": "$API_URL",
  "api_key": "",
  "domain_slug": ""
}
EOF

# Configure Claude Code hooks
echo "→ Configuring Claude Code hooks..."

if [ -f "$CLAUDE_SETTINGS" ]; then
    # Backup existing settings
    cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup"
    echo "  (Backed up existing settings to settings.json.backup)"
fi

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
    # Merge hooks into existing settings
    if [ -f "$CLAUDE_SETTINGS" ]; then
        EXISTING=$(cat "$CLAUDE_SETTINGS")
    else
        EXISTING="{}"
    fi

    echo "$EXISTING" | jq '. + {
        "hooks": {
            "UserPromptSubmit": [
                {
                    "matcher": ".*",
                    "command": "python3 '"$QUAD_HOOK"' \"$PROMPT\""
                }
            ],
            "AssistantResponse": [
                {
                    "matcher": ".*",
                    "command": "python3 '"$QUAD_HOOK"' \"$RESPONSE\" --post"
                }
            ]
        }
    }' > "$CLAUDE_SETTINGS"
else
    # Create simple settings without jq
    cat > "$CLAUDE_SETTINGS" << EOF
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "command": "python3 $QUAD_HOOK \"\$PROMPT\""
      }
    ],
    "AssistantResponse": [
      {
        "matcher": ".*",
        "command": "python3 $QUAD_HOOK \"\$RESPONSE\" --post"
      }
    ]
  }
}
EOF
fi

echo ""
echo "  ✓ QUAD hooks installed successfully!"
echo ""
echo "  ─────────────────────────────────────────────"
echo "  Files created:"
echo "    $QUAD_HOOK"
echo "    $QUAD_DIR/config.json"
echo "    $CLAUDE_SETTINGS"
echo ""
echo "  API endpoint: $API_URL"
echo "  ─────────────────────────────────────────────"
echo ""
echo "  Next steps:"
echo "    1. Get API key from: https://quadframe.work/signup"
echo "    2. Add key to: $QUAD_DIR/config.json"
echo "    3. Open Claude Code and try: quad-help"
echo ""
echo "  Or set environment variable:"
echo "    export QUAD_API_KEY=\"your-api-key\""
echo ""
