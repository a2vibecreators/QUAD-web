#!/bin/bash
# =============================================================================
# QUAD Platform - Vaultwarden Secret Fetcher
# =============================================================================
# Fetches secrets from Vaultwarden for specified environment
#
# Usage:
#   export BW_SESSION=$(bw unlock --raw)
#   source deployment/scripts/fetch-secrets.sh dev
#   source deployment/scripts/fetch-secrets.sh qa
#   source deployment/scripts/fetch-secrets.sh prod
#
# This script EXPORTS environment variables for use in deployment scripts
# =============================================================================

# Note: Do NOT use 'set -e' as this script is sourced, not executed

ENV=${1:-dev}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_status() { echo -e "${CYAN}[vault]${NC} $1"; }
print_success() { echo -e "${GREEN}[vault]${NC} $1"; }
print_error() { echo -e "${RED}[vault]${NC} $1"; }

# Load Vaultwarden config
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../vault.config.sh"

# QUAD Organization ID (from vault.config.sh)
QUAD_ORG_ID="$VAULT_QUAD_ORG_ID"

# Collection IDs per environment (from actual Vaultwarden)
case "$ENV" in
    dev)
        COLLECTION_ID="bd26fd3e-b01f-47a9-80e9-9841b52fc1c6"
        ;;
    qa)
        COLLECTION_ID="5b3ffa64-ee2e-41e2-a05a-11d4603f5496"
        ;;
    prod)
        COLLECTION_ID="0dc1c5d4-0b3d-49fc-8ab9-2322e1e2db67"
        ;;
    *)
        print_error "Invalid environment: $ENV (must be dev, qa, or prod)"
        exit 1
        ;;
esac

# Check BW_SESSION
if [ -z "$BW_SESSION" ]; then
    print_error "BW_SESSION not set. Run: export BW_SESSION=\$(bw unlock --raw)"
    exit 1
fi

print_status "Fetching secrets for ${ENV} environment from Vaultwarden..."

# =============================================================================
# Fetch NextAuth Secret
# =============================================================================
print_status "Getting NextAuth Secret..."
NEXTAUTH_SECRET=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"NextAuth Secret\" and (.collectionIds | contains([\"$COLLECTION_ID\"]))) | .login.password" 2>/dev/null | head -1)

if [ -z "$NEXTAUTH_SECRET" ] || [ "$NEXTAUTH_SECRET" = "null" ]; then
    print_error "Failed to get NextAuth Secret from Vaultwarden"
    exit 1
fi
export NEXTAUTH_SECRET
print_success "✓ NextAuth Secret loaded"

# =============================================================================
# Fetch Google OAuth Credentials
# =============================================================================
print_status "Getting Google OAuth credentials..."
GOOGLE_OAUTH=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"Google OAuth\" and (.collectionIds | contains([\"$COLLECTION_ID\"])))" 2>/dev/null)

if [ -z "$GOOGLE_OAUTH" ] || [ "$GOOGLE_OAUTH" = "null" ]; then
    print_error "Failed to get Google OAuth from Vaultwarden"
    exit 1
fi

export GOOGLE_CLIENT_ID=$(echo "$GOOGLE_OAUTH" | jq -r '.fields[] | select(.name=="client_id") | .value')
export GOOGLE_CLIENT_SECRET=$(echo "$GOOGLE_OAUTH" | jq -r '.fields[] | select(.name=="client_secret") | .value')
print_success "✓ Google OAuth credentials loaded"

# =============================================================================
# Fetch GitHub OAuth Credentials (Optional)
# =============================================================================
print_status "Getting GitHub OAuth credentials (optional)..."
GITHUB_OAUTH=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"GitHub OAuth\" and (.collectionIds | contains([\"$COLLECTION_ID\"])))" 2>/dev/null)

if [ -n "$GITHUB_OAUTH" ] && [ "$GITHUB_OAUTH" != "null" ] && [ "$GITHUB_OAUTH" != "" ]; then
    export GITHUB_CLIENT_ID=$(echo "$GITHUB_OAUTH" | jq -r '.fields[] | select(.name=="client_id") | .value')
    export GITHUB_CLIENT_SECRET=$(echo "$GITHUB_OAUTH" | jq -r '.fields[] | select(.name=="client_secret") | .value')
    print_success "✓ GitHub OAuth credentials loaded"
else
    print_status "  No GitHub OAuth configured (skipped)"
    export GITHUB_CLIENT_ID=""
    export GITHUB_CLIENT_SECRET=""
fi

# =============================================================================
# Fetch Database Credentials
# =============================================================================
print_status "Getting Database credentials..."
DB_CREDS=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"Database\" and (.collectionIds | contains([\"$COLLECTION_ID\"])))" 2>/dev/null)

if [ -z "$DB_CREDS" ] || [ "$DB_CREDS" = "null" ]; then
    print_error "Failed to get Database credentials from Vaultwarden"
    exit 1
fi

# Try login.username first, if null extract from url field
export DB_USER=$(echo "$DB_CREDS" | jq -r '.login.username')
if [ -z "$DB_USER" ] || [ "$DB_USER" = "null" ]; then
    # Extract username from url field (postgresql://USERNAME:password@host...)
    export DB_USER=$(echo "$DB_CREDS" | jq -r '.fields[] | select(.name=="url") | .value' | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
fi

export DB_PASSWORD=$(echo "$DB_CREDS" | jq -r '.login.password')
export DB_HOST=$(echo "$DB_CREDS" | jq -r '.fields[] | select(.name=="host") | .value')
export DB_NAME=$(echo "$DB_CREDS" | jq -r '.fields[] | select(.name=="database") | .value')
print_success "✓ Database credentials loaded"

# =============================================================================
# Fetch Anthropic API Key (Optional)
# =============================================================================
print_status "Getting Anthropic API Key (optional)..."
ANTHROPIC_KEY=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"Anthropic API Key\" and (.collectionIds | contains([\"$COLLECTION_ID\"]))) | .login.password" 2>/dev/null | head -1)

if [ -n "$ANTHROPIC_KEY" ] && [ "$ANTHROPIC_KEY" != "null" ] && [ "$ANTHROPIC_KEY" != "" ]; then
    export ANTHROPIC_API_KEY="$ANTHROPIC_KEY"
    print_success "✓ Anthropic API Key loaded"
else
    print_status "  No Anthropic API Key configured (skipped)"
    export ANTHROPIC_API_KEY=""
fi

# =============================================================================
# Fetch Google Gemini API Key (Optional)
# =============================================================================
print_status "Getting Google Gemini API Key (optional)..."
GEMINI_KEY=$(bw list items --organizationid "$QUAD_ORG_ID" 2>/dev/null | \
    jq -r ".[] | select(.name==\"Google Gemini API Key\" and (.collectionIds | contains([\"$COLLECTION_ID\"]))) | .login.password" 2>/dev/null | head -1)

if [ -n "$GEMINI_KEY" ] && [ "$GEMINI_KEY" != "null" ] && [ "$GEMINI_KEY" != "" ]; then
    export GEMINI_API_KEY="$GEMINI_KEY"
    print_success "✓ Google Gemini API Key loaded"
else
    # Fall back to shared NutriNine key
    export GEMINI_API_KEY="AIzaSyBA27fTF2AyRISvz0LAJTX9mCL8B2PJxBY"
    print_status "  Using shared NutriNine Gemini key"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
print_success "╔════════════════════════════════════════════════╗"
print_success "║  All secrets loaded for ${ENV} environment! ✓     ║"
print_success "╚════════════════════════════════════════════════╝"
echo ""
print_status "Exported variables:"
echo "  - NEXTAUTH_SECRET"
echo "  - GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - GITHUB_CLIENT_ID (if configured)"
echo "  - GITHUB_CLIENT_SECRET (if configured)"
echo "  - DB_USER"
echo "  - DB_PASSWORD"
echo "  - DB_HOST"
echo "  - DB_NAME"
echo "  - ANTHROPIC_API_KEY (if configured)"
echo "  - GEMINI_API_KEY"
echo ""
