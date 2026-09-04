# Launch readiness: remove hardcoded data and finish the gaps

## What I found

The dashboard KPIs, trips, fuel, maintenance, documents and alerts already run on real database data. The remaining fake data is concentrated in the Analytics area, plus a few leftover developer artefacts.

### 1. Analytics hook (`src/hooks/useAnalytics.tsx`) — fake numbers
- Monthly cost trend: 6 random values (Jan–Jun).
- Utilisation trend: 6 random values labelled 2023.
- Driver stats: `totalDrivers: 12`, `activeDrivers: 8` hardcoded.
- Top performers: fictional people (Alex Johnson, Maria Garcia, John Smith) with invented scores.
- Maintenance overview: `upcomingMaintenanceCount: 5`, `overdueMaintenanceCount: 2` hardcoded.
- Driver performance: `fuelEfficiencyRating` and `safetyScore` generated with `Math.random()` — they change on every refresh.

### 2. Leftover developer artefacts
- `src/components/ModalDemo.tsx` — unused demo component.
- `ProductionReadiness.tsx` — steps with a disabled "Coming Soon" button instead of a real action.

## What I will do

**Real analytics data**
- Compute the cost trend from actual monthly fuel logs and vehicle services across the selected date range (real month labels, real currency totals).
- Compute the utilisation trend from actual monthly trip activity (distinct vehicles used per month) with real month labels.
- Read driver counts from the `drivers` table; "active" = drivers with at least one trip in the range.
- Build top performers from real trip volume, distance and approval compliance, showing real driver names; show an empty state when there is no data yet.
- Read upcoming and overdue maintenance counts from `maintenance_schedules` (scheduled date in future vs past, excluding completed).
- Replace the random driver ratings with derived values: fuel efficiency from that driver's real km-per-litre versus the fleet average, and replace the invented "safety score" with a real trip-completion metric (trips closed with an end reading and end time). Where a driver has no fuel data, show "No data" rather than a made-up number.
- Every card gets a proper empty state so a brand-new company sees "No data yet" instead of zeros that look broken.

**Cleanup and launch checks**
- Delete the unused `ModalDemo` component.
- Remove the dead "Coming Soon" steps from the production readiness screen (or point them at the real page) so nothing in the shipped UI advertises an unbuilt feature.
- Walk every route for each role (super admin, company admin, supervisor, driver) and confirm no page renders invented data, then typecheck.

## Technical notes
- Analytics queries stay untouched at the security layer: tenant isolation continues to come from RLS, so company admins keep seeing only their own fleet and the super admin sees everything.
- Trend aggregation is done in the hook from single ranged queries (no extra round trips per month).
- `src/types/analytics.ts` gets small type adjustments where a metric becomes nullable ("No data").

## Out of scope
- Payment integration (no DPO keys yet).
- External configuration you must do in your own accounts: Google Maps domain authorisation and Resend sending-domain verification.
