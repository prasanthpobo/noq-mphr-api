#!/usr/bin/env bash
# One-time bootstrap on a fresh Hostinger VPS (Ubuntu 22.04 / 24.04).
# Installs Node 20, PM2, Nginx, certbot, creates the app dir & log dir.
#
# Usage (run on your laptop):
#   scp -i ~/.ssh/zerotoken_deploy server/deploy/server-setup.sh root@72.62.133.93:/root/
#   ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'bash /root/server-setup.sh'
#
# Idempotent — safe to re-run.

set -euo pipefail

APP_DIR="/var/www/zerotoken/testapi"
LOG_DIR="/var/log/zerotoken"
DOMAIN="testapi.zerotoken.in"
ADMIN_EMAIL="admin@zerotoken.in"

echo "==> Updating apt"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y

echo "==> Installing base tools"
apt-get install -y curl ca-certificates gnupg ufw rsync git nginx

echo "==> Installing Node.js 20 (NodeSource)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v
npm -v

echo "==> Installing PM2 globally"
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
pm2 -v

echo "==> Installing certbot (for HTTPS later)"
apt-get install -y certbot python3-certbot-nginx

echo "==> Creating app + log directories"
mkdir -p "$APP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p /var/www/letsencrypt
chown -R www-data:www-data /var/www/letsencrypt
chown -R root:root "$APP_DIR" "$LOG_DIR"

echo "==> Installing Nginx site (HTTP only — certbot will add HTTPS)"
# Drop the conf if the deploy already shipped it; else write a minimal one.
if [ -f "$APP_DIR/deploy/nginx-testapi.conf" ]; then
  cp "$APP_DIR/deploy/nginx-testapi.conf" "/etc/nginx/sites-available/$DOMAIN"
else
  cat > "/etc/nginx/sites-available/$DOMAIN" <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    client_max_body_size 25m;
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
fi
ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
# Disable the default landing page so the new vhost answers cleanly.
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Configuring UFW firewall (SSH + HTTP + HTTPS)"
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || true
yes | ufw enable || true
ufw status

echo "==> Issuing TLS certificate via certbot (best-effort)"
if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "Cert already exists — skipping issuance."
else
  certbot --nginx -d "$DOMAIN" --redirect --non-interactive --agree-tos -m "$ADMIN_EMAIL" || \
    echo "WARN: certbot failed (DNS may not be propagated yet). Re-run later: certbot --nginx -d $DOMAIN"
fi

echo
echo "✓ Bootstrap complete."
echo "  Next: from your laptop, run ./server/deploy/deploy.sh"
echo "  Then visit: https://$DOMAIN/api/health"
