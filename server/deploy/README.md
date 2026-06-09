# Deployment — testapi.zerotoken.in

Backend Node/Express + MongoDB Atlas, deployed to a Hostinger VPS behind Nginx via PM2.

| Setting | Value |
|---|---|
| Host        | `root@72.62.133.93` |
| SSH key     | `~/.ssh/zerotoken_deploy` |
| App dir     | `/var/www/zerotoken/testapi` |
| Domain      | `testapi.zerotoken.in` |
| App port    | `5000` (proxied by Nginx) |
| PM2 name    | `zerotoken-testapi` |
| Logs        | `/var/log/zerotoken/testapi.{out,err}.log` |

## First-time setup (run once on the VPS)

```bash
# from your laptop
scp -i ~/.ssh/zerotoken_deploy server/deploy/server-setup.sh root@72.62.133.93:/root/
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'bash /root/server-setup.sh'
```

This installs Node 20, PM2, Nginx, certbot, opens the firewall, drops the Nginx vhost, and issues a Let's Encrypt cert for `testapi.zerotoken.in`. Idempotent — re-runnable.

## Required environment

Copy [`server/.env.production.example`](../.env.production.example) to `/var/www/zerotoken/testapi/.env` on the VPS and fill in real values. `chmod 600`. Required keys:

| Variable | Purpose | If missing |
|---|---|---|
| `MONGO_URI`            | MongoDB Atlas connection string | server can't boot |
| `JWT_SECRET`           | sign auth tokens                | `phone-login` returns 500 `"secretOrPrivateKey must have a value"` |
| `ALLOWED_ORIGIN`       | CORS whitelist (comma-separated) | browser fetches blocked |
| `RAZORPAY_KEY_ID`      | Razorpay test/live key id       | BookFlow Confirm step shows `"Booking failed. Please try again."` |
| `RAZORPAY_KEY_SECRET`  | Razorpay key secret             | same as above |
| `OTP_ENABLE=true`      | only on test envs — echoes OTP back, auto-provisions patients | OTP Preview pill never shows; unknown phones get generic response |

`.env` is gitignored by design. Never commit secrets — push them via SSH only.

## Deploy a new build

```bash
bash server/deploy/deploy.sh           # build + push + reload
bash server/deploy/deploy.sh --env     # also overwrite remote .env
bash server/deploy/deploy.sh --skip-build  # reuse existing dist/
```

What it does:

1. `npm ci && npm run build` locally (TypeScript → `dist/`).
2. `rsync` `dist/`, `package.json`, `package-lock.json`, and `deploy/` to the VPS.
3. Pushes `.env` only if remote `.env` is missing or you passed `--env`.
4. `npm ci --omit=dev` on the VPS.
5. `pm2 reload` (or first-time `pm2 start` + `pm2 save` + boot-hook).
6. Refreshes the Nginx vhost and reloads Nginx.
7. Smoke-tests `http://127.0.0.1:5000/api/health`.

## Common ops

```bash
# tail logs
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'pm2 logs zerotoken-testapi --lines 200'

# restart
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'pm2 restart zerotoken-testapi'

# manual cert renewal test
ssh -i ~/.ssh/zerotoken_deploy root@72.62.133.93 'certbot renew --dry-run'
```

## Notes

- **`.env` lives only on the server** at `/var/www/zerotoken/testapi/.env`, mode `600`. Don't commit it.
- **Uploads** are persisted at `/var/www/zerotoken/testapi/uploads/`. They are NOT rsynced or wiped during deploys.
- **Atlas** is used for MongoDB — no local DB on the VPS.
- The TypeScript `dist/` is built locally; the VPS only runs the compiled JS.
