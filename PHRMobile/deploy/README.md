# Deployment — testapp.zerotoken.in

PHRMobile (patient-facing PHR PWA), Vite + React, served as static files by Nginx on the same Hostinger VPS that hosts `testapi.zerotoken.in` and `testweb.zerotoken.in`.

| Setting | Value |
|---|---|
| Host       | `root@72.62.133.93` |
| SSH key    | `~/.ssh/zerotoken_deploy` |
| App dir    | `/var/www/zerotoken/testapp` |
| Domain     | `testapp.zerotoken.in` |
| Backend    | `https://testapi.zerotoken.in/api` (set via `PHRMobile/.env` `VITE_API_URL`) |
| OTP pill   | `OTP_ENABLE=true` in `PHRMobile/.env` |

## Deploy

```bash
bash PHRMobile/deploy/deploy.sh               # build + atomic swap
bash PHRMobile/deploy/deploy.sh --skip-build  # reuse existing dist/
bash PHRMobile/deploy/deploy.sh --no-cert     # skip certbot (already issued)
```

What it does:

1. `npm ci && npm run build` locally → `PHRMobile/dist/`.
2. Atomic upload: writes to `/var/www/zerotoken/testapp.new`, moves current → `.old`, swaps in the new one.
3. On the first run only: installs an HTTP-only stub vhost so certbot can answer the ACME challenge via webroot, then issues the cert.
4. Always pushes the full SSL-aware vhost `nginx-testapp.conf` and reloads Nginx.
5. Smoke-tests HTTP + HTTPS.

## Rollback

```bash
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 \
  'rm -rf /var/www/zerotoken/testapp && mv /var/www/zerotoken/testapp.old /var/www/zerotoken/testapp'
```

The previous build is kept at `…/testapp.old` until the next deploy overwrites it.

## Environment

`PHRMobile/.env` is read at **build time**:

```env
VITE_API_URL=https://testapi.zerotoken.in/api
OTP_ENABLE=true
```

Change either, then re-run `deploy.sh`.
