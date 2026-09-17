# Simplify the DollarCash dashboard

## Changes
- Keep `/dashboard` as a static, mobile-friendly view with only four cards: Total Balance, Rate, EasyPaisa, and JazzCash.
- Remove the admin page, its server helper, and every Admin Panel link or access check in shared navigation.
- Remove obsolete admin/PIN code and clean resulting unused imports.
- Fix remaining route and import/type errors that prevent deployment, without changing unrelated user flows.

## Technical details
- Delete the admin route file rather than editing the generated route map.
- Let TanStack regenerate `routeTree.gen.ts` from the remaining route files; do not hand-edit generated code.
- Validate the generated routes, latest build status, and dashboard rendering.
