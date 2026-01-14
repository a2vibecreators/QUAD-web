#!/bin/bash
#
# QUAD Installer
# ==============
# Installs QUAD CLI and hooks for Claude Code
#
# Usage: curl -fsSL https://downloads.quadframe.work/install.sh | bash
#
# Copyright (c) 2026 Gopi Suman Addanke. All Rights Reserved.

set -e

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     QUAD - Quick Unified Agentic Dev      ║"
echo "  ║     Installer v1.0.0                      ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

# Configuration
QUAD_DIR="$HOME/.quad"
QUAD_CLI_DIR="$QUAD_DIR/quad-cli"
QUAD_HOOK="$QUAD_DIR/quad-context-hook.py"
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
API_URL="${QUAD_API_URL:-https://api.quadframe.work}"
DOWNLOAD_BASE="https://downloads.quadframe.work"
GITHUB_REPO="https://github.com/a2Vibes/QUAD.git"

# Check Python
echo "→ Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "  ✗ Error: Python 3 not installed!"
    echo ""
    echo "  Please install Python 3 first:"
    echo "    brew install python3  (macOS)"
    echo "    sudo apt install python3  (Ubuntu)"
    exit 1
fi
PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
echo "  ✓ Python $PYTHON_VERSION found"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo "  ✗ Error: pip3 not found!"
    echo "  Please install pip: python3 -m ensurepip"
    exit 1
fi

# Check git
if ! command -v git &> /dev/null; then
    echo "  ✗ Error: git not installed!"
    exit 1
fi

# Create QUAD directory
echo "→ Creating QUAD directory..."
mkdir -p "$QUAD_DIR"

# Clone or update QUAD repo
echo "→ Installing QUAD CLI..."
if [ -d "$QUAD_CLI_DIR" ]; then
    echo "  Updating existing installation..."
    cd "$QUAD_CLI_DIR"
    git pull origin main --quiet
else
    echo "  Cloning from GitHub..."
    git clone --depth 1 "$GITHUB_REPO" "$QUAD_CLI_DIR" --quiet
fi

# Install quad-cli
echo "→ Installing Python dependencies..."
cd "$QUAD_CLI_DIR/quad-cli"
pip3 install -e . --quiet 2>/dev/null || pip3 install -e .

# Verify installation
if command -v quad &> /dev/null; then
    echo "  ✓ quad-cli installed"
else
    # Add to PATH hint
    echo "  ⚠ quad command not in PATH"
    echo "  Add to your shell profile:"
    echo "    export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

# Download hook script (standalone version)
echo "→ Downloading QUAD hook..."
curl -fsSL "$DOWNLOAD_BASE/quad-context-hook.py" -o "$QUAD_HOOK" 2>/dev/null || \
    cp "$QUAD_CLI_DIR/quad-cli/quad_cli/commands/hook.py" "$QUAD_HOOK"
chmod +x "$QUAD_HOOK"

# Create config
echo "→ Creating config..."
if [ ! -f "$QUAD_DIR/config.json" ]; then
    cat > "$QUAD_DIR/config.json" << EOF
{
  "api_url": "$API_URL",
  "domain_slug": ""
}
EOF
fi

# Configure Claude Code hooks (if Claude is installed)
if [ -d "$HOME/.claude" ]; then
    echo "→ Configuring Claude Code hooks..."

    if [ -f "$CLAUDE_SETTINGS" ]; then
        cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.backup"
        echo "  (Backed up existing settings)"
    fi

    if command -v jq &> /dev/null; then
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
                ]
            }
        }' > "$CLAUDE_SETTINGS"
    else
        cat > "$CLAUDE_SETTINGS" << EOF
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "command": "python3 $QUAD_HOOK \"\$PROMPT\""
      }
    ]
  }
}
EOF
    fi
    echo "  ✓ Claude Code hooks configured"
else
    echo "  ℹ Claude Code not installed - skipping hook setup"
fi

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     ✓ QUAD installed successfully!        ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""
echo "  Commands available:"
echo "    quad --help       Show all commands"
echo "    quad login        Authenticate"
echo "    quad init         Initialize a project"
echo "    quad question     Ask with org context"
echo ""
echo "  Files created:"
echo "    $QUAD_CLI_DIR"
echo "    $QUAD_DIR/config.json"
echo "    $QUAD_HOOK"
echo ""
echo "  API endpoint: $API_URL"
echo ""
echo "  Get started:"
echo "    quad login"
echo "    quad init"
echo ""
