# Deployment — testweb.zerotoken.in

Vite + React SPA, served as static files by Nginx on the same Hostinger VPS that hosts `testapi.zerotoken.in`.

| Setting | Value |
|---|---|
| Host       | `root@72.62.133.93` |
| SSH key    | `~/.ssh/zerotoken_deploy` |
| App dir    | `/var/www/zerotoken/testweb` |
| Domain     | `testweb.zerotoken.in` |
| Backend    | `https://testapi.zerotoken.in/api` (set via `frontend/.env` `VITE_API_URL`) |

## Deploy

```bash
bash frontend/deploy/deploy.sh               # build + atomic swap
bash frontend/deploy/deploy.sh --skip-build  # reuse existing dist/
bash frontend/deploy/deploy.sh --no-cert     # skip certbot (already issued)
```

What it does:

1. `npm ci && npm run build` locally → `frontend/dist/`.
2. Atomic upload: writes to `/var/www/zerotoken/testweb.new`, moves current → `.old`, swaps in the new one.
3. Pushes `nginx-testweb.conf` to `/etc/nginx/sites-available/`, links it, reloads Nginx.
4. Issues a Let's Encrypt cert on first run (skipped on later runs).
5. Smoke-tests the vhost.

## Rollback

```bash
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 \
  'rm -rf /var/www/zerotoken/testweb && mv /var/www/zerotoken/testweb.old /var/www/zerotoken/testweb'
```

The previous build is kept at `…/testweb.old` until the next deploy overwrites it.

## Environment

The frontend reads its API URL at **build time** from `frontend/.env`:

```env
VITE_API_URL=https://testapi.zerotoken.in/api
```

Change that file *before* running `deploy.sh` to point the SPA at a different backend.
