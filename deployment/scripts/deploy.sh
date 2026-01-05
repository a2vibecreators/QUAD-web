#!/bin/bash
# =============================================================================
# quad-web - Deployment Script
# =============================================================================
# Deploys Next.js web application to specified environment
#
# Usage:
#   ./deploy.sh dev              # Deploy to DEV
#   ./deploy.sh qa               # Deploy to QA
#   ./deploy.sh prod             # Deploy to PROD (GCP)
#   ./deploy.sh dev db           # Push database schema only
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$(dirname "$WEB_DIR")"  # Go up from deployment/scripts to quad-web
ENV="${1:-dev}"
COMPONENT="${2:-web}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${GREEN}[quad-web]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[quad-web]${NC} $1"; }
print_error() { echo -e "${RED}[quad-web]${NC} $1"; }

# Environment-specific configs
case "$ENV" in
    dev)
        PORT=14001
        DB_PORT=14201
        DB_HOST="postgres-dev"
        DB_NAME="quad_dev_db"
        DB_PASS="quad_dev_pass"
        DOMAIN="dev.quadframe.work"
        NETWORK="docker_dev-network"
        CONTAINER="quadframework-web-dev"
        ;;
    qa)
        PORT=15001
        DB_PORT=15201
        DB_HOST="postgres-qa"
        DB_NAME="quad_qa_db"
        DB_PASS="quad_qa_pass"
        DOMAIN="qa.quadframe.work"
        NETWORK="docker_qa-network"
        CONTAINER="quadframework-web-qa"
        ;;
    prod)
        print_status "PROD uses GCP Cloud Run"
        # TODO: Add GCP deployment
        exit 0
        ;;
    *)
        echo "Usage: $0 {dev|qa|prod} [db|web]"
        exit 1
        ;;
esac

export DATABASE_URL="postgresql://quad_user:${DB_PASS}@localhost:${DB_PORT}/${DB_NAME}"

# Deploy database schema
deploy_db() {
    print_status "Pushing Prisma schema to ${ENV}..."
    cd "$WEB_DIR"
    npx prisma generate
    npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
    print_status "Database schema deployed"
}

# Deploy web application
deploy_web() {
    print_status "Building Docker image..."
    cd "$WEB_DIR"

    # Build image
    docker build -t quadframework-web:${ENV} .

    # Stop existing container
    docker stop $CONTAINER 2>/dev/null || true
    docker rm $CONTAINER 2>/dev/null || true

    # Load secrets from env file if exists
    ENV_FILE="$SCRIPT_DIR/../${ENV}/.env"
    if [ -f "$ENV_FILE" ]; then
        print_status "Loading env from $ENV_FILE"
        set -a && source "$ENV_FILE" && set +a
    fi

    # Run container
    print_status "Starting container on port ${PORT}..."
    docker run -d \
        --name $CONTAINER \
        --network $NETWORK \
        -p ${PORT}:3000 \
        --restart unless-stopped \
        -e DATABASE_URL="postgresql://quad_user:${DB_PASS}@${DB_HOST}:5432/${DB_NAME}" \
        -e NEXTAUTH_URL="https://${DOMAIN}" \
        -e NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-changeme}" \
        -e QUAD_API_URL="${QUAD_API_URL:-http://quad-services-${ENV}:8080}" \
        -e GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}" \
        -e GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}" \
        -e GITHUB_CLIENT_ID="${GITHUB_CLIENT_ID:-}" \
        -e GITHUB_CLIENT_SECRET="${GITHUB_CLIENT_SECRET:-}" \
        quadframework-web:${ENV}

    print_status "Container started: $CONTAINER"
    print_status "URL: https://${DOMAIN}"
}

# Main
case "$COMPONENT" in
    db|database)
        deploy_db
        ;;
    web|"")
        deploy_web
        ;;
    all)
        deploy_db
        deploy_web
        ;;
    *)
        echo "Usage: $0 {dev|qa|prod} [db|web|all]"
        exit 1
        ;;
esac
