# Deployment Guide

## Quick Deploy to Production

### 1. Verify Prerequisites

```bash
# Ensure you have completed all items in PRODUCTION_CHECKLIST.md
```

### 2. Configure Supabase

1. **Set Auth URLs** (CRITICAL)
   ```
   Site URL: https://your-domain.com
   Redirect URLs:
   - https://your-domain.com/**
   - https://staging.your-domain.com/** (if applicable)
   ```

2. **Enable Security Features**
   - Enable leaked password protection
   - Upgrade Postgres to latest version
   - Review and configure RLS policies

3. **Configure Email**
   - Set up custom SMTP provider
   - Test email delivery
   - Update email templates if needed

### 3. Environment Configuration

Ensure all required secrets are set in Supabase Dashboard > Edge Functions:

```
RESEND_API_KEY=your_resend_api_key
APP_URL=https://your-domain.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Build for Production

```bash
# Install dependencies
npm install

# Run production build
npm run build

# Test the build locally
npm run preview
```

### 5. Deploy

#### Option A: Deploy to Lovable (Recommended)

1. Click the "Publish" button in Lovable
2. Follow the deployment wizard
3. Configure your custom domain (if applicable)

#### Option B: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Option C: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### 6. Post-Deployment Verification

1. **Test Critical Flows**
   - [ ] Sign up new user
   - [ ] Sign in existing user
   - [ ] Password reset
   - [ ] Create vehicle
   - [ ] Log trip
   - [ ] Schedule maintenance
   - [ ] Upload document

2. **Verify Integrations**
   - [ ] Email delivery working
   - [ ] Database connections stable
   - [ ] Edge functions responding
   - [ ] Storage buckets accessible

3. **Monitor Initial Traffic**
   ```bash
   # Watch Supabase logs
   # Go to: Dashboard > Logs
   
   # Check for errors in:
   - Database logs
   - Auth logs
   - Edge Function logs
   ```

### 7. DNS Configuration

If using a custom domain:

```
# Add these DNS records:
Type: CNAME
Name: your-subdomain (or @)
Value: your-deployment-url.app
TTL: 3600
```

### 8. SSL/TLS

Ensure HTTPS is enabled:
- Most platforms (Vercel, Netlify, Lovable) provide automatic SSL
- Verify SSL certificate is valid
- Enable HSTS (HTTP Strict Transport Security)

## Rollback Procedure

If issues occur:

1. **Immediate Rollback**
   ```bash
   # If using Vercel
   vercel rollback
   
   # If using Netlify
   netlify rollback
   
   # If using Lovable
   # Use the Lovable dashboard to revert to previous version
   ```

2. **Database Rollback** (if needed)
   ```sql
   -- Restore from backup in Supabase Dashboard
   -- Settings > Backups > Restore
   ```

## Monitoring Setup

### 1. Error Tracking

Integrate Sentry for production error tracking:

```typescript
// Add to main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
  tracesSampleRate: 0.1,
});
```

### 2. Analytics

Add Google Analytics:

```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### 3. Uptime Monitoring

Set up external monitoring:
- [UptimeRobot](https://uptimerobot.com/) (Free tier available)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

## Performance Optimization

### 1. Enable Caching

```typescript
// Configure Vite for production caching
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
});
```

### 2. CDN Configuration

If using custom deployment:
- Enable CDN for static assets
- Configure caching headers
- Enable compression (Gzip/Brotli)

### 3. Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trip_logs(driver_id);
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
```

## Maintenance Windows

Plan regular maintenance:

1. **Weekly**: Review error logs and performance metrics
2. **Monthly**: Security updates and dependency updates
3. **Quarterly**: Full security audit and performance review

## Support & Escalation

Document your support procedures:

1. **Level 1**: User-reported issues
2. **Level 2**: System alerts and monitoring
3. **Level 3**: Critical security or data issues

## Success Criteria

Deployment is successful when:
- [ ] Application accessible at production URL
- [ ] All authentication flows working
- [ ] No critical errors in logs (first 24 hours)
- [ ] Database queries performant (< 100ms p95)
- [ ] Email delivery functional
- [ ] SSL certificate valid
- [ ] All user roles functioning correctly
- [ ] Monitoring and alerts configured
- [ ] Backup verification complete

## Getting Help

- **Supabase Support**: [https://supabase.com/support](https://supabase.com/support)
- **Lovable Support**: [https://lovable.dev/discord](https://lovable.dev/discord)
- **Emergency Contacts**: Document your team's emergency contacts
