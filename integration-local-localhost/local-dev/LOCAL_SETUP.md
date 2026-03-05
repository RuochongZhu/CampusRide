# Localhost-Only Setup (No Cloud DB)

This copy is isolated for local testing and does not use production Supabase.

## Quick start (recommended)

```bash
cd integration-local-localhost
./local-dev/start-local-stack.sh
```

If your shell environment kills background jobs, run these in dedicated terminals:

```bash
postgrest local-dev/postgrest.conf
```

```bash
node local-dev/supabase-shim.mjs
```

## 1) Initialize local database

```bash
cd integration-local-localhost
./local-dev/setup-local-db.sh
```

## 2) Start local PostgREST

```bash
cd integration-local-localhost
./local-dev/start-postgrest.sh
./local-dev/start-supabase-shim.sh
```

Health check:

```bash
curl -I http://127.0.0.1:54321/
curl -I http://127.0.0.1:54322/health
```

Stop when needed:

```bash
./local-dev/stop-postgrest.sh
./local-dev/stop-supabase-shim.sh
```

## 3) Start backend

```bash
cd integration-local-localhost/campusride-backend
npm run dev
```

## 4) Start frontend

```bash
cd integration-local-localhost
npm run dev
```

## Default local test accounts

- `localadmin@cornell.edu` / `Test12345`
- `localuser@cornell.edu` / `Test12345`

## Local mode behavior

- WeChat login disabled (`DISABLE_WECHAT_AUTH=true`)
- WeChat short-link generation disabled (`DISABLE_WECHAT_FEATURES=true`)
- Scheduled cleanup task disabled (`ENABLE_CLEANUP_SERVICE=false`)
- Email sending disabled (`ENABLE_EMAIL_SENDING=false`)
