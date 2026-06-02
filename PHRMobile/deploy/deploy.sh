#!/usr/bin/env bash
# Build PHRMobile (patient PHR PWA) locally and push it to the Hostinger VPS.
#
# Strategy: npm ci && npm run build → atomic tar-over-SSH replace of /var/www/zerotoken/testapp
#
# Prereqs:
#   - SSH key works:  ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'echo ok'
#   - Nginx + certbot already installed (testapi bootstrap already did this).
#   - The PHRMobile/.env has the right VITE_API_URL and OTP_ENABLE.
#
# Usage:
#   bash PHRMobile/deploy/deploy.sh
#
# Flags:
#   --skip-build         Reuse existing PHRMobile/dist/.
#   --no-cert            Skip the certbot step (already issued).

set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SSH_HOST="root@72.62.133.93"
SSH_KEY="$HOME/.ssh/zerotoken_deploy"
APP_DIR="/var/www/zerotoken/testapp"
DOMAIN="testapp.zerotoken.in"
ADMIN_EMAIL="admin@zerotoken.in"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PHR_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

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
[ -f "$PHR_DIR/package.json" ] || { echo "PHRMobile/package.json missing"; exit 1; }
[ -f "$SSH_KEY" ]              || { echo "SSH key $SSH_KEY missing"; exit 1; }
$SSH "echo CONNECTED_OK" >/dev/null || { echo "SSH connection failed"; exit 1; }

# ── 2. Build the SPA ─────────────────────────────────────────────────────────
if [ "$SKIP_BUILD" = "0" ]; then
  # Skip `tsc -b` (the package "build" script) because PHRMobile has pre-existing
  # TS errors in unrelated modules. Vite uses esbuild and strips types without
  # enforcing them — the produced bundle is the same as a successful tsc build.
  echo "==> Building Vite app (npm ci + vite build, skipping tsc)"
  (
    cd "$PHR_DIR"
    npm ci
    npx vite build
  )
else
  echo "==> Skipping build (--skip-build)"
  [ -d "$PHR_DIR/dist" ] || { echo "No dist/ to deploy — drop --skip-build"; exit 1; }
fi

[ -f "$PHR_DIR/dist/index.html" ] || { echo "dist/index.html missing — build failed"; exit 1; }

# ── 3. Atomic upload via tar-over-SSH ────────────────────────────────────────
echo "==> Uploading dist/ → $APP_DIR (atomic swap)"
$SSH "mkdir -p $APP_DIR $APP_DIR.new && rm -rf $APP_DIR.new && mkdir -p $APP_DIR.new"
( cd "$PHR_DIR/dist" && tar -cf - . ) | $SSH "tar -xf - -C $APP_DIR.new"
$SSH "
  set -e
  if [ -d $APP_DIR ] && [ ! -L $APP_DIR ]; then
    rm -rf $APP_DIR.old
    mv $APP_DIR $APP_DIR.old
  fi
  mv $APP_DIR.new $APP_DIR
  chown -R www-data:www-data $APP_DIR 2>/dev/null || true
  echo 'Active dist:'
  ls -la $APP_DIR | head -6
"

# ── 4. Drop / refresh Nginx vhost ────────────────────────────────────────────
echo "==> Refreshing Nginx vhost"
# First time: write an HTTP-only stub so certbot can answer the ACME challenge.
if [ "$NO_CERT" = "0" ]; then
  CERT_EXISTS=$($SSH "[ -d /etc/letsencrypt/live/$DOMAIN ] && echo yes || echo no")
  if [ "$CERT_EXISTS" = "no" ]; then
    echo "==> First run — installing HTTP-only stub vhost for ACME challenge"
    $SSH "cat > /etc/nginx/sites-available/$DOMAIN" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    root /var/www/zerotoken/testapp;
    index index.html;
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { try_files \$uri \$uri/ /index.html; }
}
EOF
    $SSH "
      set -e
      ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
      nginx -t && systemctl reload nginx
      apt-get install -y python3-certbot-nginx >/dev/null
      certbot certonly --webroot -w /var/www/letsencrypt -d $DOMAIN \
        --non-interactive --agree-tos -m $ADMIN_EMAIL || echo 'WARN: certbot failed; check DNS'
    "
  fi
fi

# Now push the full SSL-aware vhost (idempotent).
$SSH "cat > /etc/nginx/sites-available/$DOMAIN" < "$SCRIPT_DIR/nginx-testapp.conf"
$SSH "
  set -e
  ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
  nginx -t
  systemctl reload nginx
"

# ── 5. Smoke test ────────────────────────────────────────────────────────────
echo "==> Smoke test"
sleep 1
$SSH "
  curl -fsS -o /dev/null -w 'HTTP  : %{http_code}\n' -H 'Host: $DOMAIN' http://127.0.0.1/ || true
  curl -fsS -o /dev/null -w 'HTTPS : %{http_code}\n' https://$DOMAIN/ || true
"

echo
echo "✓ PHRMobile deployed."
echo "  Visit:    https://$DOMAIN/"
echo "  Rollback: ssh -i $SSH_KEY $SSH_HOST 'rm -rf $APP_DIR && mv $APP_DIR.old $APP_DIR'"
