# Multi-Company Support Feature

## Overview

This feature allows users to be members of multiple companies with different roles in each company. Users can switch between companies seamlessly without logging out, and their role is preserved for each company context.

## Key Features

1. **Multiple Company Memberships**: Users can belong to multiple companies
2. **Role Preservation**: Each user can have a different role in each company
3. **Company Switcher UI**: Easy-to-use dropdown to switch between companies
4. **Automatic Context**: All data queries automatically filter by the current active company
5. **Persistent Selection**: Last selected company is remembered in localStorage

## Database Schema

### user_roles Table
- **Unique Constraint**: `(user_id, company_id)` - One role per user per company
- **Fields**: 
  - `user_id`: UUID reference to auth.users
  - `company_id`: UUID reference to companies
  - `role`: app_role enum (super_admin, company_admin, supervisor, driver)

### Database Functions

#### get_user_companies(p_user_id uuid)
Returns all companies a user belongs to with their role in each company.

```sql
SELECT * FROM get_user_companies('user-uuid-here');
```

Returns:
- company_id
- company_name
- company_logo
- role
- is_active
- subscription_type

#### get_user_role_for_company(p_user_id uuid, p_company_id uuid)
Returns the user's role for a specific company.

```sql
SELECT get_user_role_for_company('user-uuid', 'company-uuid');
```

## Usage

### For Users

1. **View Companies**: When logged in with multiple companies, a company switcher appears in the sidebar
2. **Switch Company**: Click the company switcher and select a different company
3. **Role Changes**: Your role badge shows your current role in the selected company
4. **Auto Reload**: The page automatically reloads with the new company context

### For Administrators

#### Adding a User to Multiple Companies

```sql
-- Add user to first company as company_admin
INSERT INTO user_roles (user_id, company_id, role)
VALUES ('user-uuid', 'company-1-uuid', 'company_admin');

-- Add same user to second company as supervisor
INSERT INTO user_roles (user_id, company_id, role)
VALUES ('user-uuid', 'company-2-uuid', 'supervisor');
```

#### Removing User from a Company

```sql
DELETE FROM user_roles 
WHERE user_id = 'user-uuid' 
AND company_id = 'company-uuid';
```

#### Checking User's Companies

```sql
SELECT * FROM get_user_companies('user-uuid');
```

## UI Components

### CompanySwitcher Component
Located at: `src/components/navigation/CompanySwitcher.tsx`

Features:
- Only appears when user has 2+ companies
- Shows company logo and name
- Displays current role as badge
- Trial/Full subscription indicator
- Search functionality

### Integration Points
1. **Sidebar** (Desktop): `src/components/ui/sidebar.tsx`
2. **Mobile Navigation**: `src/components/navigation/MobileNavigation.tsx`

## Hooks

### useCompanySwitcher(userId)
Custom hook for managing company switching.

```tsx
const { 
  companies,           // List of all user companies
  currentCompany,      // Currently selected company
  currentCompanyId,    // ID of current company
  loading,            // Loading state
  switchCompany,      // Function to switch company
  refetch            // Refresh companies list
} = useCompanySwitcher(userId);
```

## State Management

### AuthState
Updated to include `currentCompanyId`:

```typescript
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  currentCompanyId: string | null;  // NEW
}
```

### LocalStorage
- Key: `current_company_id`
- Persists the last selected company across sessions

## Security Considerations

1. **RLS Policies**: All tables should filter by company_id using the current company context
2. **Role Verification**: Each company switch verifies the user has access to that company
3. **Data Isolation**: Users can only see data for their current active company
4. **Super Admin Exception**: Super admins can see all companies

## Testing

### Test Scenarios

1. **Single Company User**
   - Company switcher should not appear
   - User works normally with their one company

2. **Multi-Company User**
   - Company switcher appears
   - Can switch between companies
   - Role changes per company
   - Data filtered correctly

3. **New User Added to Second Company**
   - User can switch to new company
   - Correct role in each company

4. **User Removed from Company**
   - Cannot access removed company
   - Automatically switches to another company if current one is removed

### Manual Testing Steps

1. Create a test user
2. Add user to Company A as "company_admin"
3. Add same user to Company B as "supervisor"
4. Sign in and verify company switcher appears
5. Switch between companies and verify:
   - Role badge updates
   - Dashboard shows correct company data
   - Navigation options match role

## Troubleshooting

### Company Switcher Not Appearing
- Check user has roles in multiple companies
- Verify `get_user_companies` function returns multiple companies
- Check browser console for errors

### Wrong Role After Switching
- Clear localStorage and try again
- Verify user_roles table has correct data
- Check `get_user_role_for_company` function

### Data from Wrong Company
- Ensure all queries filter by `company_id`
- Check RLS policies include company_id filter
- Verify `currentCompanyId` is set in auth state

## Future Enhancements

1. **Company Invitations**: UI for inviting users to additional companies
2. **Bulk User Management**: Admin UI for managing multi-company users
3. **Company Context Indicator**: Persistent header showing current company
4. **Quick Switch Hotkey**: Keyboard shortcut for company switching
5. **Recent Companies**: Show recently accessed companies first
