# Classroom promotion UI PR notes

## What changed
- Added `/app/counselor/classroom-promotions` page.
- Added navigation item for `admin` and `career_counselor` users.
- Supports school/year/graduation-year setup, localized `preview`, route summary, per-student manual target classroom overrides, `apply`, and `rollback`.
- Sends current frontend locale (`ru|kk|en`) to backend promotion APIs.

## Checks
- `npm run build` ✅
- `npx eslint src/routes/counselor/ClassroomPromotionPage.tsx src/routes/index.tsx src/components/Layout.tsx src/translations/ru.ts src/translations/kk.ts src/translations/en.ts` ✅ with existing hook-deps warnings only.
- Full `npm run lint` is still red because of pre-existing lint errors in unrelated files.

## Manual check note
- Current `https://dev.steptest.kz/app/counselor/classroom-promotions` returns 404 before frontend deploy, as expected.
