# Library static content deploy note

The career counselor Library page uses two different kinds of files:

1. `public/library/manifest.json` — metadata, tracked in git.
2. `public/library/files/` — PDF lesson/static content, **not tracked in git**.

`public/library/files/` is intentionally ignored because these PDFs are static content artifacts, not frontend source code. Do not delete this directory from production or staging during deploys.

## Why this matters

A clean git checkout/build will not contain `public/library/files/`, because the PDFs are ignored and not stored in GitHub. If a deploy replaces the frontend directory wholesale, the Library page can keep rendering from `manifest.json`, but PDF links will return 404.

## Deploy requirement

Production/staging deploys must preserve or restore the static library files separately from git code.

Use one of these approaches:

### Option A: preserve the directory in-place

If deploy updates the existing source/build directory, make sure it does not remove:

```text
public/library/files/
```

and, after `npm run build`, make sure the files are present under the built static output:

```text
dist/library/files/
```

### Option B: keep static content outside the repo and copy it during deploy

Recommended for clean deploys:

```text
/var/www/sn_static/library/files/        # persistent source of PDFs
<frontend-release>/dist/library/files/  # copied/synced target served by frontend
```

Example deploy step:

```bash
mkdir -p dist/library/files
rsync -a --delete /var/www/sn_static/library/files/ dist/library/files/
```

Use `--delete` only if `/var/www/sn_static/library/files/` is known to be the complete canonical copy.

### Option C: symlink from the build output

If nginx/static serving allows symlinks:

```bash
mkdir -p dist/library
ln -sfn /var/www/sn_static/library/files dist/library/files
```

## Verification after deploy

Check that:

```text
/app/library/manifest.json
/app/library/files/<file-from-manifest>.pdf
```

both return `200`.

Also verify one Library download link in the UI.

## Rules for future updates

- Commit changes to `public/library/manifest.json` when the visible Library list changes.
- Do not commit PDF files under `public/library/files/`.
- Do not commit local backup artifacts such as `professions_full_bkp.json`.
- When adding/removing PDFs, update the persistent static content location used by deploy.
