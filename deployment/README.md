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
