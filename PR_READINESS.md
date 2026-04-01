# PR Readiness Check

Date: 2026-04-01 (UTC)
Branch: `work`
HEAD commit: `27127d0`

## Automated checks

### 1) Lint
Command: `npm run lint`

Result: **FAILED**

- Total issues: **259**
- Errors: **222**
- Warnings: **37**
- Affected files: **97**

Top files by issue count:

1. `src/routes/counselor/ClassroomResultsPage.tsx` — 22 errors, 1 warning
2. `src/routes/CareerCounselorsPage.tsx` — 17 errors, 1 warning
3. `src/routes/SchoolPage.tsx` — 15 errors, 2 warnings
4. `src/routes/StudentsPage.tsx` — 16 errors, 1 warning
5. `src/routes/ClassroomAssignmentsPage.tsx` — 12 errors, 1 warning

Dominant issue types:

- `@typescript-eslint/no-explicit-any`
- `@typescript-eslint/no-unused-vars`
- `react-hooks/exhaustive-deps`

### 2) Build
Command: `npm run build`

Result: **PASSED**

- TypeScript build + Vite production build completed successfully.
- Vite reported oversized chunks (>500 kB), which is a warning, not a hard failure.

## Verdict

Current commit **is not ready for PR** if lint is a required gate, because lint fails with 222 errors.

## Suggested next steps

1. Resolve lint errors in highest-issue route files first.
2. Replace `any` types with concrete interfaces/types.
3. Remove unused variables/imports.
4. Fix hook dependency warnings (`react-hooks/exhaustive-deps`) or document safe exceptions.
5. Re-run:
   - `npm run lint`
   - `npm run build`
