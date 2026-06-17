# Workflow Completeness & Error Handling Pass

Goal: every role (super_admin, company_admin, supervisor, driver) can complete their core workflows end-to-end, and every failure path surfaces a clear, actionable message instead of a silent crash or cryptic toast.

## Scope by role

**Driver**
- Log a trip (just fixed — driver_id auto-resolution).
- View own trips, see approval status.
- Upload personal documents, view expiry reminders.
- Read & reply to messages.

**Supervisor**
- Approve / reject pending trips with a comment.
- Assign vehicles to drivers, view fleet status.
- Log fuel entries, view maintenance schedule.

**Company Admin**
- Everything supervisor can do, plus:
- Invite users, manage roles within the company.
- Manage vehicles, drivers, service centers, document categories.
- Configure company branding, notification templates, currency.

**Super Admin**
- Manage companies (create / suspend / activate).
- Cross-company audit logs & security dashboard.
- Promote first user; cannot assign super_admin elsewhere.

## Error-handling standard to apply everywhere

1. Every `supabase` call wrapped in `try/catch` with a `toast.error` carrying a human-readable message (never the raw Postgres code).
2. Every mutation form has a loading state on its submit button and disables it while pending.
3. Required fields validated client-side before the network call.
4. RLS-denied rows surface as "You don't have permission to do this" rather than empty UI.
5. Network/offline failures degrade to the offline queue where one exists (trips, vehicle logs) and toast "Saved offline" otherwise.
6. Empty states ("No vehicles yet", "No pending approvals") instead of blank panels.
7. Every page-level data fetch routes through a single `ErrorBoundary` so a thrown render doesn't blank the whole app.

## Work items

```text
1. Driver workflows
   - NewTrip: confirm driver_id flow end-to-end, add empty-state on vehicle list.
   - DriverPortal: error boundary + retry button on data fetch failure.
   - Messages: toast on send failure, optimistic update rollback.

2. Supervisor workflows
   - TripApprovals: confirm dialog before reject, require comment on reject,
     toast both success & failure, refresh list after action.
   - VehicleAssignment: validate non-overlapping date ranges client-side,
     show RLS error as friendly message.
   - FuelManagement: numeric validation, currency formatting, error toast.

3. Company admin workflows
   - UserManagement / invitations: catch duplicate-email, expired-token,
     surface as targeted errors.
   - Companies (own): branding upload size/type validation, logo
     replacement cleans up old file (already in trigger — verify).
   - Notification templates: validate template variables before save.

4. Super admin workflows
   - Companies list: confirm before suspend; block self-demotion.
   - SecurityDashboard: handle missing metrics gracefully (skeleton, not crash).
   - Setup page: enforce single-super-admin rule with clear message.

5. Global hardening
   - Wrap each top-level route in <ErrorBoundary> in routes.tsx.
   - Replace any remaining `console.log` in mutation paths with `logger.error`
     plus a user-facing toast.
   - Audit all `supabase.from(...).insert/update/delete` for missing `.select()`
     / unchecked `error` returns.
   - Ensure every protected page has an `<allowedRoles>` guard matching
     the workflow it serves.
```

## Out of scope

- New features or visual redesigns.
- Backend schema changes (no new tables / columns / policies).
- Edge function changes unless a bug is found mid-pass.

## Deliverable

A single sweep through the files above, committing edits in batches by role.
End state: every role's primary workflow runs without unhandled errors, and
every failure produces a clear toast + recoverable UI.

Reply **"go"** to start, or tell me which role / area to prioritize first
if you want a narrower scope.
