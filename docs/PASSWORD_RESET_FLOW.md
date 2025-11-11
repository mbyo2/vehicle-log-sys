# Password Reset Flow Documentation

## Overview
The password reset flow allows users to securely reset their password when they've forgotten their credentials. The flow includes email notifications with custom branded templates.

## Flow Steps

### 1. Request Password Reset
**User Action:** Click "Forgot password?" on the sign-in page

**Process:**
- User enters their email address in the password reset dialog
- System validates the email format
- Supabase generates a secure reset token
- Custom email sent via Resend with reset link

### 2. Email Notification
**Email Contains:**
- Professional branded template
- Secure reset link with token
- Link expiration notice (1 hour)
- Security notice for unrequested resets

**Email Template:** `supabase/functions/send-email/_templates/password-reset-email.tsx`

### 3. Reset Password
**User Action:** Click link in email

**Process:**
- User redirected to `/reset-password` page with tokens
- Tokens extracted from URL and session established
- User enters new password with strength validation
- Password requirements enforced (8+ chars, uppercase, lowercase, number, special character)
- Confirmation password must match

### 4. Completion
**Success State:**
- Password successfully updated in Supabase
- Success message displayed
- Auto-redirect to sign-in page after 3 seconds
- Toast notification confirms update

## Security Features

### Token Security
- One-time use tokens
- 1-hour expiration
- Secure PKCE flow
- Tokens transmitted via URL parameters only

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Password strength meter provides real-time feedback

### Email Security
- Sent via secure Resend API
- Custom branded templates prevent phishing
- Clear security warnings in email
- No sensitive information in email

## Email Configuration

### Required Setup
1. **Resend Account:** Sign up at https://resend.com
2. **Domain Verification:** Verify your sending domain at https://resend.com/domains
3. **API Key:** Create API key at https://resend.com/api-keys
4. **Secret Configuration:** Add `RESEND_API_KEY` to Supabase secrets

### Supabase URL Configuration
Configure in Supabase Dashboard under Authentication > URL Configuration:

**Site URL:** Your application URL (preview or production)
**Redirect URLs:** Add all valid redirect URLs:
- Preview URL: `https://your-preview-url.lovableproject.com/reset-password`
- Production URL: `https://yourdomain.com/reset-password`

## User Experience

### Error Handling
- Invalid email format → Validation error before submission
- Account not found → Generic success message (security best practice)
- Expired token → Clear error message with option to request new reset
- Network errors → User-friendly error messages with retry option

### Success Indicators
- Email sent confirmation
- Password updated confirmation
- Visual feedback throughout process
- Auto-redirect after successful reset

## Testing the Flow

### Manual Test Steps
1. Navigate to sign-in page
2. Click "Forgot password?"
3. Enter valid email address
4. Check email inbox for reset email
5. Click reset link in email
6. Enter new password (meeting all requirements)
7. Confirm new password matches
8. Submit form
9. Verify redirect to sign-in
10. Sign in with new password

### Expected Behavior
✅ Email received within 1-2 minutes
✅ Reset link works and loads page
✅ Password validation enforces all requirements
✅ Password strength meter updates in real-time
✅ Success message displayed after update
✅ Can sign in with new password

## Components

### Frontend Components
- `src/components/auth/PasswordResetDialog.tsx` - Request reset dialog
- `src/pages/ResetPassword.tsx` - Reset password page
- `src/components/auth/PasswordStrengthMeter.tsx` - Password validation UI

### Backend Components
- `supabase/functions/send-email/index.ts` - Email sending edge function
- `supabase/functions/send-email/_templates/password-reset-email.tsx` - Email template

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify domain is verified in Resend
- Check Resend API key is configured
- Review edge function logs for errors

### Reset Link Not Working
- Verify URL configuration in Supabase
- Check token hasn't expired (1 hour limit)
- Ensure redirect URL matches configured URLs
- Check browser console for errors

### Password Update Fails
- Verify password meets all requirements
- Check passwords match
- Review network tab for API errors
- Check Supabase connection

## Rate Limiting

Password reset requests are subject to rate limiting:
- Maximum 5 requests per 15 minutes per email address
- Prevents brute force attacks
- Automatic cooldown period after limit exceeded

## Best Practices

### For Users
- Use a strong, unique password
- Store passwords in a password manager
- Never share reset links
- Report suspicious emails

### For Administrators
- Monitor reset request patterns
- Review failed reset attempts
- Keep Supabase and email templates updated
- Test reset flow regularly

## Future Enhancements

Potential improvements:
- SMS-based password reset option
- Multi-factor authentication requirement
- Account recovery questions
- Magic link authentication as alternative
- Password history to prevent reuse
