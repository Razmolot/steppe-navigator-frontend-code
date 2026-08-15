# Production frontend deploy

The frontend is a Vite SPA served from `/var/www/steppe_app` under `/app/`.

Important: `VITE_API_URL` is compiled into the JS bundle at build time. If it is
omitted, the app falls back to `http://localhost:8000`, which breaks production
logins from users' browsers.

Use the helper script from the repository root:

```bash
./scripts/build-production.sh
```

or run the equivalent command manually:

```bash
VITE_API_URL=https://steppe-navigator.kz npm run build
```

After building, deploy the contents of `dist/` to `/var/www/steppe_app/`.
