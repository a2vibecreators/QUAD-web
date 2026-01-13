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
        DB_HOST="quad-db-dev"
        DB_NAME="quad_dev_db"
        DB_PASS="quad_dev_pass"
        DOMAIN="dev.quadframe.work"
        NETWORK="dev-network"
        CONTAINER="quad-web-dev"
        ;;
    qa)
        PORT=15001
        DB_PORT=15201
        DB_HOST="quad-db-qa"
        DB_NAME="quad_qa_db"
        DB_PASS="quad_qa_pass"
        DOMAIN="qa.quadframe.work"
        NETWORK="qa-network"
        CONTAINER="quad-web-qa"
        ;;
    prod)
        print_status "PROD uses GCP Cloud Run"

        # Check prerequisites
        if [ -z "$BW_SESSION" ]; then
            print_error "BW_SESSION not set. Run: export BW_SESSION=\$(bw unlock --raw)"
            exit 1
        fi

        # GCP Configuration
        GCP_PROJECT="nutrinine-prod"
        GCP_REGION="us-east1"
        GCP_SERVICE="quad-web-prod"
        GCP_IMAGE="gcr.io/${GCP_PROJECT}/quad-web:latest"
        CLOUD_SQL_INSTANCE="${GCP_PROJECT}:${GCP_REGION}:nutrinine-db"

        # Fetch secrets from Vaultwarden
        print_status "Fetching secrets from Vaultwarden (PROD collection)..."
        source "$SCRIPT_DIR/fetch-secrets.sh" prod

        # Build DATABASE_URL for Cloud SQL
        DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_INSTANCE}"

        DOMAIN="quadframe.work"
        NETWORK=""  # Cloud Run doesn't use Docker networks
        CONTAINER=""  # Cloud Run service name
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

# Deploy web application (DEV/QA - Docker on Mac Studio)
deploy_web() {
    print_status "Building Docker image..."
    cd "$WEB_DIR"

    # Build image
    docker build -t quad-web:${ENV} .

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
        -e ZOOM_ACCOUNT_ID="${ZOOM_ACCOUNT_ID:-}" \
        -e ZOOM_CLIENT_ID="${ZOOM_CLIENT_ID:-}" \
        -e ZOOM_CLIENT_SECRET="${ZOOM_CLIENT_SECRET:-}" \
        quad-web:${ENV}

    print_status "Container started: $CONTAINER"
    print_status "URL: https://${DOMAIN}"
}

# Deploy web application (PROD - GCP Cloud Run)
deploy_web_prod() {
    print_status "Deploying to GCP Cloud Run..."
    cd "$WEB_DIR"

    # Ensure gcloud is authenticated
    print_status "Checking GCP authentication..."
    gcloud config set project $GCP_PROJECT

    # Build Docker image for amd64 (Cloud Run requires linux/amd64)
    print_status "Building Docker image for Cloud Run (amd64)..."
    docker build --platform linux/amd64 -t $GCP_IMAGE .

    # Configure Docker to use gcloud as credential helper
    print_status "Configuring Docker for GCR..."
    gcloud auth configure-docker --quiet

    # Push to Google Container Registry
    print_status "Pushing image to GCR..."
    docker push $GCP_IMAGE

    # Deploy to Cloud Run
    print_status "Deploying to Cloud Run..."

    # Get backend URL (use actual Cloud Run URL, not custom domain yet)
    BACKEND_URL="https://quad-services-prod-605414080358.us-east1.run.app/v1"

    gcloud run deploy $GCP_SERVICE \
        --image=$GCP_IMAGE \
        --region=$GCP_REGION \
        --platform=managed \
        --allow-unauthenticated \
        --memory=512Mi \
        --cpu=1 \
        --max-instances=10 \
        --min-instances=0 \
        --timeout=300 \
        --add-cloudsql-instances=$CLOUD_SQL_INSTANCE \
        --set-env-vars="DATABASE_URL=${DATABASE_URL},NEXTAUTH_URL=https://${DOMAIN},NEXTAUTH_SECRET=${NEXTAUTH_SECRET},QUAD_API_URL=${BACKEND_URL},GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID},GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET},GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID:-},GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET:-},ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-},GEMINI_API_KEY=${GEMINI_API_KEY:-AIzaSyBA27fTF2AyRISvz0LAJTX9mCL8B2PJxBY},SPRING_PROFILES_ACTIVE=prod"

    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $GCP_SERVICE --region=$GCP_REGION --format='value(status.url)')

    print_success "╔════════════════════════════════════════════════╗"
    print_success "║  PROD Deployment Complete! ✓                  ║"
    print_success "╚════════════════════════════════════════════════╝"
    echo ""
    print_status "Service URL: $SERVICE_URL"
    print_status "Custom Domain: https://${DOMAIN}"
    echo ""
    print_status "Next Steps:"
    echo "  1. Map custom domain: gcloud beta run domain-mappings create --service=$GCP_SERVICE --domain=$DOMAIN --region=$GCP_REGION"
    echo "  2. Update Cloudflare DNS to point to ghs.googlehosted.com"
    echo "  3. Wait for SSL certificate provisioning (15-30 minutes)"
    echo ""
}

# Main
case "$COMPONENT" in
    db|database)
        if [ "$ENV" = "prod" ]; then
            print_error "Database deployment for PROD not supported (use Cloud SQL directly)"
            print_status "Use: gcloud sql databases create quad_prod_db --instance=nutrinine-db"
            exit 1
        fi
        deploy_db
        ;;
    web|"")
        if [ "$ENV" = "prod" ]; then
            deploy_web_prod
        else
            deploy_web
        fi
        ;;
    all)
        if [ "$ENV" = "prod" ]; then
            print_error "Database deployment for PROD not supported"
            print_status "Deploy web only: $0 prod web"
            exit 1
        fi
        deploy_db
        deploy_web
        ;;
    *)
        echo "Usage: $0 {dev|qa|prod} [db|web|all]"
        exit 1
        ;;
esac
