# Feature: Bulk AI reports UI

Branch: `prod`

## Commits
- `1ba3c40` — bulk AI reports UI (start + progress page)
- `509dc3a` — docs + i18n: bulk statuses + spec
- `da76092` — lint/cleanup for bulk pages

## Screens / flows

- Counselor starts bulk generation for a school.
- UI navigates to the bulk job page and polls status every ~2.5 seconds.
- Counselor can cancel a running/queued job.

## Backend contract

Relies on API endpoints:
- `POST /api/counselor/career/schools/{schoolId}/bulk-generate`
- `GET /api/counselor/career/bulk-jobs/{jobId}`
- `POST /api/counselor/career/bulk-jobs/{jobId}/cancel`

Spec: `docs/spec/BULK_AI_REPORTS_TZ.md`
