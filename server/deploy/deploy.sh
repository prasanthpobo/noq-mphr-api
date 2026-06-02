#!/usr/bin/env bash
# Push the latest server build to the Hostinger VPS.
# Strategy: build locally → rsync dist/ + package*.json + deploy/ → install prod deps → pm2 reload
#
# Prereqs:
#   - SSH key works: ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'echo ok'
#   - You ran server-setup.sh once on the VPS.
#   - server/.env exists in this repo (will be copied if remote .env is missing).
#
# Usage (from the repo root or anywhere):
#   bash server/deploy/deploy.sh
#
# Flags:
#   --skip-build    Reuse the existing dist/ folder.
#   --env           Force-overwrite the remote .env from your local server/.env.

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SSH_HOST="root@72.62.133.93"
SSH_KEY="$HOME/.ssh/zerotoken_deploy"
APP_DIR="/var/www/zerotoken/testapi"
APP_NAME="zerotoken-testapi"
DOMAIN="testapi.zerotoken.in"

# ── Paths (resolve relative to this script so it works from anywhere) ────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# ── Flags ────────────────────────────────────────────────────────────────────
SKIP_BUILD=0
PUSH_ENV=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --env)        PUSH_ENV=1 ;;
    *) echo "Unknown flag: $arg"; exit 2 ;;
  esac
done

SSH="ssh -i $SSH_KEY -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=12 $SSH_HOST"
RSYNC_SSH="ssh -i $SSH_KEY -o BatchMode=yes -o StrictHostKeyChecking=accept-new"

# rsync is missing on many Windows shells — fall back to a tar-over-SSH pipeline.
USE_RSYNC=1
if ! command -v rsync >/dev/null 2>&1; then
  USE_RSYNC=0
  echo "==> rsync not found locally — using tar over SSH instead"
fi

# Push a single file via scp (portable).
scp_one() {
  local src="$1" dst="$2"
  scp -i "$SSH_KEY" -o BatchMode=yes -o StrictHostKeyChecking=accept-new -q "$src" "$SSH_HOST:$dst"
}

# Mirror a local directory to a remote directory atomically.
# Wipes the remote dir first, then streams a tarball into it.
sync_dir() {
  local local_dir="$1" remote_dir="$2"
  if [ "$USE_RSYNC" = "1" ]; then
    rsync -avz --delete -e "$RSYNC_SSH" "$local_dir/" "$SSH_HOST:$remote_dir/"
  else
    $SSH "rm -rf $remote_dir && mkdir -p $remote_dir"
    ( cd "$local_dir" && tar -cf - . ) | $SSH "tar -xf - -C $remote_dir"
  fi
}

# ── 1. Pre-flight ────────────────────────────────────────────────────────────
echo "==> Pre-flight checks"
[ -f "$SERVER_DIR/package.json" ] || { echo "server/package.json missing"; exit 1; }
[ -f "$SSH_KEY" ]                 || { echo "SSH key $SSH_KEY missing"; exit 1; }
$SSH "echo CONNECTED_OK" >/dev/null || { echo "SSH connection failed"; exit 1; }

# ── 2. Build TypeScript locally ──────────────────────────────────────────────
if [ "$SKIP_BUILD" = "0" ]; then
  echo "==> Building (npm ci + tsc)"
  (
    cd "$SERVER_DIR"
    npm ci
    npm run build
  )
else
  echo "==> Skipping build (--skip-build)"
  [ -d "$SERVER_DIR/dist" ] || { echo "No dist/ to deploy — drop --skip-build"; exit 1; }
fi

# ── 3. Ensure remote app dir exists ──────────────────────────────────────────
echo "==> Ensuring remote dirs"
$SSH "mkdir -p $APP_DIR $APP_DIR/uploads /var/log/zerotoken"

# ── 4. Push code ─────────────────────────────────────────────────────────────
echo "==> Syncing dist/"
sync_dir "$SERVER_DIR/dist" "$APP_DIR/dist"

echo "==> Syncing deploy/"
sync_dir "$SCRIPT_DIR"      "$APP_DIR/deploy"

echo "==> Pushing package.json + lockfile"
scp_one "$SERVER_DIR/package.json"      "$APP_DIR/package.json"
scp_one "$SERVER_DIR/package-lock.json" "$APP_DIR/package-lock.json"

# ── 5. Push .env if missing or --env was passed ──────────────────────────────
if [ -f "$SERVER_DIR/.env" ]; then
  REMOTE_HAS_ENV=$($SSH "[ -f $APP_DIR/.env ] && echo yes || echo no")
  if [ "$PUSH_ENV" = "1" ] || [ "$REMOTE_HAS_ENV" = "no" ]; then
    echo "==> Pushing .env"
    scp_one "$SERVER_DIR/.env" "$APP_DIR/.env"
    $SSH "chmod 600 $APP_DIR/.env"
  else
    echo "==> Keeping existing remote .env (pass --env to overwrite)"
  fi
else
  echo "WARN: no local server/.env — make sure $APP_DIR/.env exists on the VPS"
fi

# ── 6. Install production dependencies on the VPS ────────────────────────────
echo "==> Installing prod deps on VPS"
$SSH "cd $APP_DIR && npm ci --omit=dev"

# ── 7. (Re)start with PM2 ────────────────────────────────────────────────────
echo "==> Reloading PM2 process"
$SSH "
  cd $APP_DIR
  if pm2 describe $APP_NAME >/dev/null 2>&1; then
    pm2 reload deploy/ecosystem.config.js --update-env
  else
    pm2 start deploy/ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root >/dev/null
  fi
  pm2 status $APP_NAME
"

# ── 8. Refresh Nginx vhost (in case the conf changed) ────────────────────────
echo "==> Refreshing Nginx vhost"
$SSH "
  cp $APP_DIR/deploy/nginx-testapi.conf /etc/nginx/sites-available/$DOMAIN
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t && systemctl reload nginx
"

# ── 9. Smoke test ────────────────────────────────────────────────────────────
echo "==> Smoke test"
sleep 2
$SSH "curl -fsS -o /dev/null -w 'HTTP %{http_code}\n' http://127.0.0.1:5000/api/health || echo 'WARN: /api/health did not return 200'"

echo
echo "✓ Deployed. Visit: https://$DOMAIN/api/health"
echo "  Logs:    ssh -i $SSH_KEY $SSH_HOST 'pm2 logs $APP_NAME --lines 100'"
echo "  Restart: ssh -i $SSH_KEY $SSH_HOST 'pm2 restart $APP_NAME'"
