# Fuel, maintenance, documents and driver portal

Much of this already exists in the app, so the work is filling the real gaps rather than rebuilding. Here is what I found and what I will do.

## 1. Fuel and service entry forms

Already there: the Fuel page has an "Add fuel log" form, and Maintenance has a "Schedule maintenance" form.

Gaps to fix:
- The maintenance form does not record which company the service belongs to, so saving can be rejected. It will be stamped with your company.
- The fuel form does not record which driver filled up, so driver-entered logs can be rejected and per-driver fuel figures stay empty. It will record the driver and let admins pick one.
- Both will show clearer messages when a required field is missing.

## 2. Driver-only portal

Already there: driver dashboard, messages, certifications.

To add:
- A **My Trips** tab: record a trip (vehicle, start/end reading, times, purpose) and see each trip's status — waiting, approved or rejected, with the rejection reason.
- A **My Fuel** tab: record a fill-up and see only that driver's own fuel history.
- Fix the driver dashboard: assigned vehicle and recent trips currently look up the wrong identifier, so a driver can see an empty page even with trips. It will resolve the driver record properly.

Drivers keep read/write access only to their own records; nothing admin-only appears for them.

## 3. Documents with expiry alerts

Already there: upload with expiry date, list, verification, categories.

To add:
- Ability to attach a document to a specific vehicle or driver when uploading, so it shows up against that vehicle.
- **Expiring soon** (next 30 days) and **Expired** tabs with a count badge.
- A **Renew** action on an expiring document: upload the replacement and set the new expiry, keeping the old one as history.

This is what feeds the dashboard alerts panel, so once documents with expiry dates exist the panel fills up.

## 4 and 5. Signing in as a driver, and loading your real records

Two things I cannot do myself, and I want to be straight about them:

- **Signing in as your driver or supervisor.** This app uses your own separate accounts, and I have no access to them. I can't log in and click through the approval myself. Once I've shipped the above, sign in as a driver, record a trip, approve it as a supervisor, and tell me anything that looks wrong — I'll fix it immediately.
- **Your real vehicles, drivers and trips.** I won't invent plates, kilometres or expiry dates. Send me the list (plate, make, model, year, current kilometres, licence/insurance/roadworthy expiry dates; driver name, email, licence number and expiry) as a message or a spreadsheet and I'll load it for you. Otherwise you or your admin can enter them on the Fleet and Drivers pages, which will work fully after this change.

## Technical notes

- `MaintenanceScheduler.tsx`: insert `company_id` from the active profile.
- `FuelManagement.tsx`: resolve `drivers.id` via `profile_id`, add driver select for admins, default to self for drivers.
- `DriverPortal.tsx`: new `MyTrips` and `MyFuelLogs` components; `DriverDashboard.tsx` resolves the driver row instead of using the profile id against `vehicles.assigned_to` / `vehicle_logs.driver_id`.
- `Documents.tsx`: expiring/expired tabs driven by `documents.expiry_date`; `DocumentUpload` gains optional vehicle/driver selectors; renew reuses `parent_document_id` and `version`.
