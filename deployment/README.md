# QUAD Web Deployment

## Quick Start

### First-Time Setup (Required Once Per Environment)

1. **Create environment file:**
   ```bash
   # For DEV
   cd deployment/dev
   cp .env.example .env

   # For QA
   cd deployment/qa
   cp .env.example .env
   ```

2. **Fill in OAuth credentials:**
   - Get credentials from Vaultwarden: QUAD org → dev/qa collection
   - Or generate new ones at: https://console.cloud.google.com/apis/credentials
   - Edit `.env` file and replace placeholder values

3. **Deploy:**
   ```bash
   # From quad-web/deployment/dev/ or quad-web/deployment/qa/
   ./dev-deploy.sh   # or qa-deploy.sh
   ```

## Environment Files

### ⚠️ IMPORTANT: .env Files Are NOT in Git

The `.env` files contain OAuth secrets and are gitignored for security.

**What's in git:**
- ✅ `.env.example` (template with placeholders)
- ✅ Deployment scripts

**What's NOT in git:**
- ❌ `.env` (actual secrets - you must create this manually)

### Why This Matters

If you:
- Clone the repo fresh
- Switch machines
- Lose your `.env` file

Then **Google OAuth will break** and you'll see:
- ❌ "Sign in with Google" button disappears
- ❌ OAuth redirects back to login page
- ❌ Logs show: `[OAuth signIn] getUserByEmail error: fetch failed`

### How to Fix

```bash
cd deployment/dev  # or qa
cp .env.example .env
# Edit .env and fill in real OAuth credentials from Vaultwarden
```

## Container Names Reference

**CRITICAL:** Container names must match in:
1. Deployment script (`deploy.sh`)
2. Environment file (`.env` → `QUAD_API_URL`)
3. Caddyfile (`/Users/semostudio/docker/caddy/Caddyfile`)

| Environment | Web Container | Java Container | Database Container |
|-------------|---------------|----------------|-------------------|
| DEV | `quadframework-web-dev` | `quad-services-dev` | `postgres-quad-dev` |
| QA | `quadframework-web-qa` | `quad-services-qa` | `postgres-quad-qa` |

### Common Mistakes

❌ **Wrong:** `QUAD_API_URL=http://quadframework-api-dev:8080`
✅ **Correct:** `QUAD_API_URL=http://quad-services-dev:8080`

❌ **Wrong:** Caddyfile has `quad-web-dev:3000`
✅ **Correct:** Caddyfile has `quadframework-web-dev:3000`

## Deployment Scripts

| Script | Purpose |
|--------|---------|
| `deployment/dev/dev-deploy.sh` | Deploy to DEV (calls main deploy.sh) |
| `deployment/qa/qa-deploy.sh` | Deploy to QA (calls main deploy.sh) |
| `deployment/scripts/deploy.sh` | Main deployment logic (called by above) |

## URLs

| Environment | Web URL | API URL (External) | API URL (Internal) |
|-------------|---------|-------------------|-------------------|
| DEV | https://dev.quadframe.work | https://dev-api.quadframe.work | http://quad-services-dev:8080 |
| QA | https://qa.quadframe.work | https://qa-api.quadframe.work | http://quad-services-qa:8080 |

## Production Deployment (GCP Cloud Run)

### Prerequisites

1. **Vaultwarden Access:**
   ```bash
   # Unlock Vaultwarden and export session
   export BW_SESSION=$(bw unlock --raw)
   ```

2. **GCP Authentication:**
   ```bash
   # Authenticate with GCP
   gcloud auth login
   gcloud config set project nutrinine-prod
   ```

3. **Ensure Secrets Exist in Vaultwarden:**
   - QUAD org → prod collection → "NextAuth Secret"
   - QUAD org → prod collection → "Google OAuth"
   - QUAD org → prod collection → "Database"
   - QUAD org → prod collection → "Anthropic API Key" (optional)
   - QUAD org → prod collection → "Google Gemini API Key" (optional)

### Deploy to Production

```bash
# From quad-web directory
cd /Users/semostudio/git/a2vibes/QUAD/quad-web

# Ensure BW_SESSION is set
export BW_SESSION=$(bw unlock --raw)

# Deploy to Cloud Run (fetches secrets on-the-fly)
./deployment/scripts/deploy.sh prod
```

**What happens during deployment:**
1. ✅ Fetches all secrets from Vaultwarden (QUAD org → prod)
2. ✅ Builds Docker image
3. ✅ Pushes to GCP Artifact Registry (`gcr.io/nutrinine-prod/quad-web:latest`)
4. ✅ Deploys to Cloud Run (`quad-web-prod` service)
5. ✅ Configures Cloud SQL connection (`nutrinine-db` instance)
6. ✅ Sets all environment variables from Vaultwarden

**After deployment:**
- Service URL: https://quad-web-prod-605414080358.us-east1.run.app
- Custom Domain: https://quadframe.work (requires DNS setup)

### Custom Domain Setup

1. **Map custom domain:**
   ```bash
   gcloud beta run domain-mappings create \
     --service=quad-web-prod \
     --domain=quadframe.work \
     --region=us-east1
   ```

2. **Update Cloudflare DNS:**
   - Create CNAME record: `quadframe.work` → `ghs.googlehosted.com`
   - Disable Cloudflare proxy (DNS only)

3. **Wait for SSL certificate** (15-30 minutes)

## Local Development Environment Files

### Testing Against Different Environments

Use these files to test your local code changes against different infrastructure:

| File | Purpose | Database | Backend API |
|------|---------|----------|-------------|
| `.env.local.dev` | Test against DEV | localhost:14201 | localhost:14101 |
| `.env.local.qa` | Test against QA | localhost:15201 | localhost:15101 |
| `.env.local` | Active config | Symlink to dev/qa | Symlink to dev/qa |

### Usage

```bash
# Test against DEV infrastructure
cp .env.local.dev .env.local
npm run dev

# Test against QA infrastructure
cp .env.local.qa .env.local
npm run dev
```

**When to use:**
- ✅ Testing database migrations before deploying
- ✅ Verifying OAuth configuration
- ✅ Testing integration with backend API
- ✅ Debugging environment-specific issues

## Vaultwarden Secret Management

### How Secrets Are Fetched

The `deployment/scripts/fetch-secrets.sh` script automatically fetches secrets from Vaultwarden during deployment.

**Fetched automatically:**
- NextAuth Secret
- Google OAuth credentials (Client ID + Secret)
- GitHub OAuth credentials (if configured)
- Database credentials (user, password, host, database name)
- Anthropic API Key (if configured)
- Google Gemini API Key (if configured)

### Manual Secret Fetching (for debugging)

```bash
# Set Vaultwarden session
export BW_SESSION=$(bw unlock --raw)

# Fetch secrets for specific environment
source deployment/scripts/fetch-secrets.sh dev
source deployment/scripts/fetch-secrets.sh qa
source deployment/scripts/fetch-secrets.sh prod

# Verify secrets are exported
echo $NEXTAUTH_SECRET
echo $GOOGLE_CLIENT_ID
echo $DB_PASSWORD
```

## Environment Segregation Summary

| Environment | Database | Backend API | OAuth | Secrets Source | Deployment Target |
|-------------|----------|-------------|-------|----------------|-------------------|
| **DEV** | quad_dev_db (14201) | quad-services-dev:8080 | Google DEV | Vaultwarden (QUAD→dev) | Mac Studio Docker |
| **QA** | quad_qa_db (15201) | quad-services-qa:8080 | Google QA | Vaultwarden (QUAD→qa) | Mac Studio Docker |
| **PROD** | quad_prod_db (Cloud SQL) | quad-services-prod (Cloud Run) | Google PROD | Vaultwarden (QUAD→prod) | GCP Cloud Run |

## Troubleshooting

### Google Sign-In Button Missing

**Symptom:** Button doesn't appear on `/auth/login`

**Check:**
```bash
docker exec quadframework-web-dev printenv | grep GOOGLE
```

**Expected output:**
```
GOOGLE_CLIENT_ID=805817782076-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
```

**If empty**, your `.env` file is missing or not being loaded.

**Fix:**
```bash
cd deployment/dev
ls -la .env  # Does it exist?
cat .env     # Does it have OAuth values?
```

### OAuth Redirects Back to Login

**Symptom:** Click "Sign in with Google" → redirects to login page

**Check logs:**
```bash
docker logs quadframework-web-dev 2>&1 | grep OAuth
```

**Common errors:**

1. **"ENOTFOUND quadframework-api-dev"**
   - Wrong container name in `.env`
   - Should be: `QUAD_API_URL=http://quad-services-dev:8080`

2. **"getUserByEmail error: fetch failed"**
   - Java backend not running
   - Check: `docker ps | grep quad-services-dev`

3. **"401 Unauthorized"**
   - OAuth credentials wrong
   - Verify credentials in Google Cloud Console

### Caddy 502 Error

**Symptom:** `https://dev.quadframe.work` returns 502 Bad Gateway

**Check Caddyfile:**
```bash
cat /Users/semostudio/docker/caddy/Caddyfile | grep dev.quadframe.work
```

**Should see:**
```caddyfile
dev.quadframe.work {
    reverse_proxy quadframework-web-dev:3000
}
```

**Check container is on network:**
```bash
docker network inspect docker_dev-network | grep quadframework-web-dev
```

## Security Notes

- `.env` files are gitignored for security
- OAuth secrets stored in Vaultwarden (QUAD org)
- Production secrets should use Docker secrets or Kubernetes secrets
- Never commit `.env` files to git

## Related Documentation

- Main project docs: `../../CLAUDE.md`
- OAuth implementation: `../../documentation/OAUTH_IMPLEMENTATION.md`
- Session history: `../../.claude/rules/SESSION_HISTORY.md`
