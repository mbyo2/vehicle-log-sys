# User Invitation System Documentation

## Overview

The Fleet Manager application includes a complete user invitation system that allows company admins to invite team members to join their organization with specific roles.

## Features

### 1. **Invitation Creation**
- Company admins and super admins can invite users
- Role-based invitations (Driver, Supervisor, Company Admin)
- Automatic email notifications
- 7-day invitation expiry
- Secure token-based links

### 2. **Invitation Acceptance**
- Dedicated acceptance page
- Email verification
- Password creation
- Automatic account setup
- Role and company assignment

### 3. **Email Notifications**
- Professional email templates
- Branded invitation emails
- Clear call-to-action
- Invitation link with expiry notice

## Database Schema

### user_invitations Table

```sql
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role app_role NOT NULL,
  company_id UUID NOT NULL,
  invited_by UUID NOT NULL,
  token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Fields:**
- `id`: Unique identifier for the invitation
- `email`: Email address of the invitee
- `full_name`: Full name of the invitee
- `role`: Role to be assigned (driver, supervisor, company_admin)
- `company_id`: Company the user is being invited to
- `invited_by`: User who sent the invitation
- `token`: Secure UUID token for the invitation link
- `status`: Invitation status (pending, accepted, expired, cancelled)
- `expires_at`: Expiration timestamp (7 days from creation)
- `accepted_at`: When the invitation was accepted
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## User Flow

### For Inviters (Company Admins)

1. **Navigate to Settings → Team Management**
2. **Click "Invite User" button**
3. **Fill out invitation form:**
   - Full Name
   - Email Address
   - Role (based on inviter's permissions)
4. **Submit invitation**
5. **System actions:**
   - Creates database record
   - Generates secure token
   - Sends invitation email
   - Shows success confirmation

### For Invitees (New Users)

1. **Receive invitation email**
2. **Click "Accept Invitation" button**
3. **Redirected to acceptance page**
4. **Page displays:**
   - Invitee's name and email
   - Role being assigned
   - Password creation form
5. **Create password:**
   - Minimum 8 characters
   - Password strength meter
   - Confirmation field
6. **Submit acceptance**
7. **System actions:**
   - Creates user account
   - Sets up profile
   - Assigns role and company
   - Marks invitation as accepted
   - Redirects to sign-in

## Implementation Details

### Components

#### UserInviteDialog
**Location:** `src/components/auth/UserInviteDialog.tsx`

**Purpose:** Modal dialog for creating and sending invitations

**Features:**
- Form validation with Zod
- Role filtering based on inviter's permissions
- Email sending integration
- Success/error handling
- Loading states

**Usage:**
```tsx
import { UserInviteDialog } from '@/components/auth/UserInviteDialog';

<UserInviteDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSuccess={() => {
    // Refresh team list
    refetchTeam();
  }}
/>
```

#### AcceptInvitation Page
**Location:** `src/pages/AcceptInvitation.tsx`

**Purpose:** Dedicated page for accepting invitations

**Features:**
- Token validation
- Invitation expiry check
- Password creation with strength meter
- Account creation
- Error handling
- Loading states

**Route:** `/accept-invitation?token={invitation_token}`

### Email Template

The invitation email includes:
- Personalized greeting
- Inviter's name
- Company name
- Role information
- Accept invitation button
- Fallback link
- Expiry notice (7 days)

**Email Type:** `invitation`

**Template Variables:**
```typescript
{
  name: string;          // Invitee's name
  inviteUrl: string;     // Acceptance link
  companyName: string;   // Company name
  inviterName: string;   // Inviter's name
  role: string;          // Assigned role
}
```

### Security Features

#### 1. **Secure Tokens**
- UUID-based tokens (impossible to guess)
- One-time use only
- Stored in database with invitation details

#### 2. **Expiration**
- Automatic 7-day expiration
- Database-level validation
- UI feedback for expired invitations

#### 3. **Row Level Security (RLS)**
```sql
-- Company admins can view their company invitations
CREATE POLICY "Company admins can view their company invitations"
ON user_invitations FOR SELECT TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('company_admin', 'super_admin')
  )
);

-- Public can view invitation by valid token
CREATE POLICY "Public can view invitation by token"
ON user_invitations FOR SELECT TO anon
USING (
  status = 'pending' AND expires_at > now()
);
```

#### 4. **Email Verification**
- Supabase Auth email verification enabled
- EmailVerificationBanner shown after signup
- Resend verification email functionality

## API Integration

### Creating an Invitation

```typescript
const { data, error } = await supabase
  .from('user_invitations')
  .insert({
    email: 'user@example.com',
    full_name: 'John Doe',
    role: 'driver',
    company_id: currentCompanyId,
    invited_by: currentUserId,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });
```

### Sending Invitation Email

```typescript
await supabase.functions.invoke('send-email', {
  body: {
    type: 'invitation',
    email: 'user@example.com',
    data: {
      name: 'John Doe',
      inviteUrl: `${origin}/accept-invitation?token=${token}`,
      companyName: 'Acme Corp',
      inviterName: 'Jane Smith',
      role: 'driver'
    }
  }
});
```

### Accepting an Invitation

```typescript
// 1. Fetch invitation
const { data: invitation } = await supabase
  .from('user_invitations')
  .select('*')
  .eq('token', token)
  .eq('status', 'pending')
  .single();

// 2. Create user account
const { data: authData } = await supabase.auth.signUp({
  email: invitation.email,
  password: userPassword,
  options: {
    data: { full_name: invitation.full_name }
  }
});

// 3. Create user role
await supabase
  .from('user_roles')
  .insert({
    user_id: authData.user.id,
    role: invitation.role,
    company_id: invitation.company_id,
  });

// 4. Mark invitation as accepted
await supabase
  .from('user_invitations')
  .update({
    status: 'accepted',
    accepted_at: new Date().toISOString(),
  })
  .eq('id', invitation.id);
```

## Testing

### Test Invitation Flow

1. **Setup:**
   - Sign in as company admin
   - Navigate to Settings → Team

2. **Send Invitation:**
   - Click "Invite User"
   - Enter test user details
   - Submit form
   - Verify success message

3. **Check Email:**
   - Open email client
   - Find invitation email
   - Verify email content
   - Copy invitation link

4. **Accept Invitation:**
   - Open invitation link
   - Verify user details displayed
   - Create password
   - Submit acceptance
   - Verify redirect to sign-in

5. **Sign In:**
   - Use invited email and password
   - Verify access to appropriate features
   - Check role permissions

### Test Edge Cases

1. **Expired Invitation:**
   ```sql
   -- Manually expire an invitation for testing
   UPDATE user_invitations
   SET expires_at = now() - interval '1 day'
   WHERE email = 'test@example.com';
   ```
   - Try to accept expired invitation
   - Verify error message

2. **Invalid Token:**
   - Use random token in URL
   - Verify error message

3. **Already Accepted:**
   - Try to accept same invitation twice
   - Verify appropriate handling

4. **Duplicate Email:**
   - Invite user with existing account email
   - Verify error handling

## Maintenance

### Cleaning Up Expired Invitations

```sql
-- Manual cleanup
UPDATE user_invitations
SET status = 'expired'
WHERE status = 'pending'
AND expires_at < now();
```

**Automatic Cleanup Function:**
```sql
SELECT expire_old_invitations();
```

### Monitoring Invitations

```sql
-- View pending invitations
SELECT 
  email,
  full_name,
  role,
  expires_at,
  created_at
FROM user_invitations
WHERE status = 'pending'
ORDER BY created_at DESC;

-- View invitation statistics
SELECT 
  status,
  COUNT(*) as count
FROM user_invitations
GROUP BY status;
```

## Troubleshooting

### Email Not Received

1. **Check Resend Dashboard:**
   - Verify email was sent
   - Check delivery status
   - Review error logs

2. **Check Spam Folder:**
   - Invitation emails may be filtered
   - Add sender to contacts

3. **Verify Email Configuration:**
   - RESEND_API_KEY is set
   - Domain is verified
   - From email uses verified domain

### Invitation Link Not Working

1. **Check Token:**
   - Verify token is in URL
   - Check for truncation in email

2. **Check Expiration:**
   ```sql
   SELECT expires_at, status
   FROM user_invitations
   WHERE token = 'token-here';
   ```

3. **Check Database:**
   - Verify invitation exists
   - Verify status is 'pending'

### Account Creation Fails

1. **Check Supabase Auth Logs:**
   - Review signup errors
   - Check email format
   - Verify password requirements

2. **Check Database Constraints:**
   - Unique email constraint
   - Foreign key constraints
   - RLS policies

3. **Check Profile Creation:**
   - Verify handle_new_user trigger
   - Check profile table

## Future Enhancements

### Potential Improvements

1. **Invitation Management:**
   - Cancel/revoke invitations
   - Resend invitations
   - Bulk invitations
   - Invitation templates

2. **Enhanced Features:**
   - Custom expiration periods
   - Role restrictions by company
   - Welcome message customization
   - Invitation analytics

3. **User Experience:**
   - Social login for invited users
   - Invitation preview
   - Mobile-optimized acceptance page
   - Progress indicators

4. **Security:**
   - Two-factor authentication requirement
   - IP-based restrictions
   - Rate limiting on invitations
   - Audit log for invitations

5. **Automation:**
   - Scheduled invitation cleanup
   - Reminder emails for pending invitations
   - Auto-expire old invitations
   - Notification to inviter on acceptance

## Related Documentation

- [Email Verification Guide](./EMAIL_VERIFICATION_GUIDE.md)
- [Password Reset Flow](./PASSWORD_RESET_FLOW.md)
- [Multi-Company Feature](./MULTI_COMPANY_FEATURE.md)
- [Team Management](../src/components/settings/TeamManagement.tsx)

## Support

For issues or questions about the invitation system:
1. Check this documentation
2. Review edge function logs
3. Check Supabase dashboard
4. Review security audit logs
