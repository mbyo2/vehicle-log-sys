# Launch readiness

- [x] Resolve conflicting authentication state and sign-in redirect loops; route-state regression tests pass. Successful real-account login remains unverified.
- [x] Update vulnerable production dependencies, including official SheetJS 0.20.3; scanner cannot automatically verify the vendor-hosted SheetJS release.
- [x] Verify public pages and signed-out protection on desktop/mobile (1280, 780 and 390 pixels): invalid login errors display, protected pages redirect, no page errors or horizontal overflow.
- [ ] Verify signed-in driver, supervisor and admin workflows (blocked: external Supabase has no available browser session).
- [ ] Confirm production Maps authorization and verified email sending (requires service configuration verification).
- [ ] Enable leaked-password protection in hosted Supabase settings (requires hosted setting access).
- [ ] Verify Lenco checkout (blocked: API keys not supplied; retain sandbox).