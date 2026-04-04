# Feature: "Choose other spheres" from generated career report

## Goal

Align the counselor UI with the agreed UX:
- from a generated career report, counselor can go back to spheres selection **without wiping** the existing spheres
- spheres selection page should open in an explicit **edit mode** and be prefilled with current spheres

## UI changes

### Career report page (`/counselor/career/reports/:reportId`)

- Replace the destructive "Regenerate" action (which deleted the report) with:
  - **Choose other spheres** → navigates to `/counselor/career/students/:studentId?edit=1`

### Career guidance page (`/counselor/career/students/:studentId`)

- Add support for `?edit=1`:
  - do **not** auto-redirect back to the report when there is a generated report
  - prefill selected spheres from the latest report (`GET /counselor/career/reports/{report_id}`)
  - show an info alert explaining edit mode

## Notes

- Saving spheres uses `from_ai` state:
  - AI recommendation sets `from_ai=true`
  - any manual edit flips it back to `false`

## How to test

1) Open a generated report page.
2) Click "Choose other spheres".
3) Ensure spheres selection is prefilled.
4) Modify spheres and save.
5) Generate a new report.
