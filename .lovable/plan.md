# Whole-app launch check

## What the first scan found

- **No errors right now.** The app builds cleanly, and the last preview session logged no crashes, console errors or failed requests.
- **Money always shows as "$".** About 12 screens (Fuel, Maintenance, Parts, Service History, Analytics, Cost reports, the map pop-ups) have the dollar sign hard-coded. The app already has a currency setting, but no screen reads it. Your business is in South Africa, so this should follow your chosen currency (for example R).
- **Colours that break in dark mode.** Around 57 files use fixed reds, greens, ambers and blues instead of the app's theme colours. Some badges and warnings can be hard to read in dark mode or clash with your company colours.
- **Driver menu.** The driver menu has one Driver Portal entry, so the new My Trips and My Fuel tabs can only be reached from inside the portal. Drivers should be able to get to them directly from the menu.

## What I will do

1. **Currency everywhere.** Add one shared money formatter that uses the company's default currency (falling back to ZAR / R), and use it on every screen that shows an amount, including CSV/PDF exports.
2. **Theme colours.** Replace the fixed colours with the app's success, warning and danger theme colours so badges, alerts and status labels read clearly in both light and dark mode.
3. **Driver navigation.** Add My Trips and My Fuel to the driver menu, on desktop and mobile, with the correct item highlighted when it's open.
4. **Role walkthrough of every page (about 40 pages).** For super admin, company admin, supervisor and driver, check that each menu item opens a page that role is allowed to use. Each page should load, have a clear empty state when there's no data, and show readable error messages. Fix any dead links, wrong redirects or pages that load forever.
5. **Narrow-screen pass.** Check the main pages at phone width (your preview is about 780px wide) and fix overflowing tables, cramped tab bars and dialogs that don't fit.
6. **Signed-out checks.** Use an automated browser to check sign-in, sign-up, password reset and invitation pages for broken layout, page titles and console errors.
7. **Database safety check.** Run the automated security check again and report any new issues. I won't change anything outside this list without asking.

## What I can't verify myself

I can't sign in to your accounts, so I can only check pages behind sign-in by reading the code. Once this is done, please sign in as each role and tell me anything that looks off.

## Technical notes

- New `src/lib/formatMoney.ts` plus a `useCompanyCurrency()` hook reading the default `currency_settings` row for the active company. Replace `$`-prefixed literals in the files found by the scan, plus `dashboardExport.ts`.
- Map `text-red-*` / `text-green-*` / `text-amber-*` / `bg-*` utilities to semantic tokens: `destructive`, plus new `success` and `warning` tokens added to `index.css` and `tailwind.config.ts` if they're missing.
- Nav additions in the sidebar config and `MobileNavigation.tsx` for `/driver/trips` and `/driver/fuel`, driver role only.
- Cross-check `routes.tsx` `allowedRoles` against the navigation config for every role.
