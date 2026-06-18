# Final Completeness Pass

Goal: every non-payment workflow runs end-to-end with no stubs, dead buttons, or "coming soon" placeholders. Payments (DPO) deferred until you have keys.

## Verified already complete (prior passes)
- Auth: sign in, sign up, email verification, password reset, 2FA, invitations
- RBAC: super_admin / company_admin / supervisor / driver guards
- Trip logging (driver_id auto-resolve + offline queue)
- Trip approvals, vehicle assignment, fuel management
- User management + invitation form (duplicate-email guard)
- Notifications (in-app, templates, digest), document compliance reminders
- Company branding, multi-tenant switching
- SEO meta, sitemap, robots.txt, llms.txt
- Root ErrorMonitoringBoundary

## Gaps to close in this pass

1. **Driver Messages — Archive button is a stub** (`MessageList.tsx:181`)
   - Implement archive: add `is_archived` filter on the existing query, soft-archive via `messages.archived_at` or add a flag — OR remove the button and the "coming soon" toast.
   - Decision: remove the stub button (no schema change needed); show only Reply/Delete.

2. **Onboarding "Coming Soon" tile** (`ProductionReadiness.tsx:123`)
   - Replace placeholder card with the real production-readiness checklist already documented in `PRODUCTION_CHECKLIST.md`.

3. **Payments — explicitly disabled**
   - Hide / disable any "Upgrade", "Subscribe", "Buy Ad" CTA that would call DPO.
   - Replace with "Contact sales" mailto or a disabled badge "Payments coming soon".
   - Files to check: `AdPurchaseForm.tsx`, any subscription CTA in `Companies.tsx` / `Settings.tsx`.

4. **Console noise audit**
   - 158 console.log/error calls remain in `src/`. Replace user-facing failure logs in mutation paths with `logger.error` + toast. Leave dev-only logs alone.
   - Scope: only mutation/handler files (~15 files). Not a blanket sweep.

5. **Route guard audit**
   - Confirm every protected route in `routes.tsx` has `<allowedRoles>` matching its workflow (e.g. `/trip-approvals` requires supervisor+, `/companies` requires super_admin).

6. **Empty-state pass**
   - Drivers, Vehicles, Trips, Documents, ServiceBookings, Maintenance — verify each list shows `EmptyState` instead of blank table when zero rows.

7. **Smoke test in preview**
   - Sign in as each seeded role, click through primary workflow, capture any console errors.

## Out of scope
- DPO / payment integration (no keys)
- New features, redesigns, schema changes
- Edge function changes unless a bug surfaces

## Deliverable
Single sweep. End state: zero "coming soon" strings outside payments, every protected route guarded, every list has an empty state, every mutation has a toast on failure.

Reply **"go"** to execute, or tell me to narrow/skip any section.
