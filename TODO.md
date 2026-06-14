- [ ] Implement DataTable-based alerts list in `resources/js/pages/alerts/index.tsx`
  - [ ] Wire Inertia props: `alerts` (PaginatedResponse)
  - [ ] Define DataTable columns for severity, source, threshold, acknowledged, created_at, and actions
  - [ ] Enable DataTable search/filter using `filters` from backend
  - [ ] Show `EmptyState` when there are no alerts
- [ ] Verify build/typecheck (pnpm)
- [ ] Manually sanity-check /alerts route renders table and pagination UI

