#!/usr/bin/env bash
# Build the Vite SPA locally and push it to the Hostinger VPS.
#
# Strategy: npm ci && npm run build → atomic tar-over-SSH replace of /var/www/zerotoken/testweb
#
# Prereqs:
#   - SSH key works:  ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'echo ok'
#   - Nginx + certbot already installed (testapi bootstrap already did this).
#   - The frontend/.env has the right VITE_API_URL.
#
# Usage:
#   bash frontend/deploy/deploy.sh
#
# Flags:
#   --skip-build         Reuse existing frontend/dist/.
#   --no-cert            Skip the certbot step (already issued).

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SSH_HOST="root@72.62.133.93"
SSH_KEY="$HOME/.ssh/zerotoken_deploy"
APP_DIR="/var/www/zerotoken/testweb"
DOMAIN="testweb.zerotoken.in"
ADMIN_EMAIL="admin@zerotoken.in"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

SKIP_BUILD=0
NO_CERT=0
for arg in "$@"; do
  case "$arg" in
    --skip-build) SKIP_BUILD=1 ;;
    --no-cert)    NO_CERT=1 ;;
    *) echo "Unknown flag: $arg"; exit 2 ;;
  esac
done

SSH="ssh -i $SSH_KEY -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=12 $SSH_HOST"

# ── 1. Pre-flight ────────────────────────────────────────────────────────────
echo "==> Pre-flight checks"
[ -f "$FRONTEND_DIR/package.json" ] || { echo "frontend/package.json missing"; exit 1; }
[ -f "$SSH_KEY" ]                   || { echo "SSH key $SSH_KEY missing"; exit 1; }
$SSH "echo CONNECTED_OK" >/dev/null || { echo "SSH connection failed"; exit 1; }

# ── 2. Build the SPA ─────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = "0" ]; then
  echo "==> Building Vite app (npm ci + npm run build)"
  (
    cd "$FRONTEND_DIR"
    npm ci
    npm run build
  )
else
  echo "==> Skipping build (--skip-build)"
  [ -d "$FRONTEND_DIR/dist" ] || { echo "No dist/ to deploy — drop --skip-build"; exit 1; }
fi

[ -f "$FRONTEND_DIR/dist/index.html" ] || { echo "dist/index.html missing — build failed"; exit 1; }

# ── 3. Atomic upload via tar-over-SSH ────────────────────────────────────────
echo "==> Uploading dist/ → $APP_DIR (atomic swap)"
$SSH "mkdir -p $APP_DIR $APP_DIR.new && rm -rf $APP_DIR.new && mkdir -p $APP_DIR.new"
( cd "$FRONTEND_DIR/dist" && tar -cf - . ) | $SSH "tar -xf - -C $APP_DIR.new"
$SSH "
  set -e
  if [ -d $APP_DIR ] && [ ! -L $APP_DIR ]; then
    rm -rf $APP_DIR.old
    mv $APP_DIR $APP_DIR.old
  fi
  mv $APP_DIR.new $APP_DIR
  chown -R www-data:www-data $APP_DIR 2>/dev/null || true
  # Keep one previous copy for rollback; drop older snapshots.
  echo 'Active dist:'
  ls -la $APP_DIR | head -6
"

# ── 4. Drop / refresh Nginx vhost ────────────────────────────────────────────
echo "==> Refreshing Nginx vhost"
# Push the conf via stdin so we don't need scp on a separate path
$SSH "cat > /etc/nginx/sites-available/$DOMAIN" < "$SCRIPT_DIR/nginx-testweb.conf"
$SSH "
  set -e
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t
  systemctl reload nginx
"

# ── 5. TLS cert (idempotent) ─────────────────────────────────────────────────
if [ "$NO_CERT" = "0" ]; then
  echo "==> Ensuring Let's Encrypt cert"
  $SSH "
    if [ -d /etc/letsencrypt/live/$DOMAIN ]; then
      echo 'Cert already exists — skipping issuance.'
    else
      apt-get install -y python3-certbot-nginx >/dev/null
      certbot --nginx -d $DOMAIN --redirect --non-interactive --agree-tos -m $ADMIN_EMAIL || \
        echo 'WARN: certbot failed — try again after DNS propagates.'
    fi
  "
fi

# ── 6. Smoke test ────────────────────────────────────────────────────────────
echo "==> Smoke test"
sleep 1
$SSH "curl -fsS -o /dev/null -w 'http://127.0.0.1 SNI=$DOMAIN: %{http_code}\n' --resolve $DOMAIN:80:127.0.0.1 http://$DOMAIN/ || true"

echo
echo "✓ Frontend deployed."
echo "  Visit:    https://$DOMAIN/"
echo "  Rollback: ssh -i $SSH_KEY $SSH_HOST 'rm -rf $APP_DIR && mv $APP_DIR.old $APP_DIR'"
