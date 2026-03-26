# Prod snapshot workflow (steppe-navigator-frontend-code)

This repo uses a dedicated branch to track the exact state of the **deployed production frontend**.

## Branches

- `main` — normal development.
- `prod` — *source of truth* for what is currently deployed to production.

## Snapshot rule

Update `prod` **only** when production is updated.

Recommended cadence: at most weekly (or per release).

## What goes into a prod snapshot

Snapshot is taken from the deployed tree on the server (e.g. `/var/www/sn_dev_front_src/steppe-front/`).

### Exclude

Do **not** commit:
- `.env`, `.env.*`
- `node_modules/`
- `dist/`, `dist_old/`
- OS junk files (e.g. `.DS_Store`)

## Secrets / push protection

Before pushing `prod`, ensure the snapshot contains **no secrets**. In particular:
- OpenAI / other API keys (e.g. `sk-...`)
- tokens, passwords, private URLs

If a secret is found, replace it with `[REDACTED]` and move the real value to environment variables or server-side secrets.

## Tagging

For each production update, create an annotated tag:

- `prod-snapshot-YYYY-MM-DD`

Example:
- `prod-snapshot-2026-03-26`

This makes it easy to reference an exact deployed state later.
