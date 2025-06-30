# Role-Based Access Control (RBAC) System

## Overview

The Visitrack admin panel now implements a comprehensive role-based access control system that restricts access to different admin pages based on user roles. This ensures that users can only access the features and data appropriate to their role level.

## User Roles & Permissions

### 1. admin
**Full Access** - Can access all admin features
- Dashboard
- Visitor Management
- Event Management
- Badge Management
- Form Builder
- Messages
- Entry Log
- Quick Scanner
- Report
- Settings
- Profile

### 2. sub-admin
**Full Access** - Same permissions as admin
- Dashboard
- Visitor Management
- Event Management
- Badge Management
- Form Builder
- Messages
- Entry Log
- Quick Scanner
- Report
- Settings
- Profile

### 3. manager
**Limited Access** - Cannot access Reports and Settings
- Dashboard
- Visitor Management
- Event Management
- Badge Management
- Form Builder
- Messages
- Entry Log
- Quick Scanner
- Profile

### 4. staff
**Basic Access** - Only essential features
- Dashboard
- Visitor Management
- Entry Log
- Quick Scanner
- Profile

## Implementation Details

### Core Components

#### 1. Role Permissions (`src/lib/rolePermissions.ts`)
- Defines all admin routes and their allowed roles
- Provides utility functions for permission checking
- Centralizes role-based access control logic
- **Case-insensitive role checking** for flexibility

#### 2. Admin Route Guard (`src/components/AdminRouteGuard.tsx`)
- Protects admin routes from unauthorized access
- Checks user authentication and role permissions
- Shows appropriate error messages for unauthorized access
- Handles loading states during authentication

#### 3. Updated Admin Layout (`src/components/AdminLayout.tsx`)
- Dynamically shows/hides navigation items based on user role
- Wraps all admin pages with route protection
- Displays user role in the top bar
- Automatically applies protection to all admin pages

### Protection Mechanisms

#### 1. Route-Level Protection
- All admin pages are automatically protected by `AdminRouteGuard`
- Users are redirected to login if not authenticated
- Access denied page shown for insufficient permissions

#### 2. Navigation-Level Protection
- Sidebar navigation items are filtered based on user role
- Users only see menu items they have permission to access
- Prevents confusion and unauthorized access attempts

#### 3. Direct URL Protection
- Even if users paste URLs directly in the browser
- They will be blocked if they don't have permission
- Shows clear error message: "This page is not accessible for your role"

## Usage Examples

### Checking Permissions in Code
```typescript
import { hasPermission, getAccessibleRoutes } from '../lib/rolePermissions';

// Check if user can access specific route
const canAccessReports = hasPermission(userRole, '/admin/reports');

// Get all routes user can access
const accessibleRoutes = getAccessibleRoutes(userRole);
```

### Adding New Admin Pages
1. Add the new route to `adminRoutes` array in `rolePermissions.ts`
2. Specify which roles can access it
3. Create the page component using `AdminLayout`
4. The page will automatically be protected

Example:
```typescript
{
  path: '/admin/new-feature',
  name: 'New Feature',
  icon: 'svg-path-here',
  allowedRoles: ['admin', 'manager'] // Only admin and manager can access
}
```

## Database Role Format

The system uses the following role values that match your database:
- `admin` - Full administrative access
- `sub-admin` - Full administrative access (same as admin)
- `manager` - Limited administrative access
- `staff` - Basic access to essential features

**Important**: The system is case-insensitive, so `admin`, `Admin`, or `ADMIN` will all work correctly.

## Testing the System

### Manual Testing
1. Login with different role accounts
2. Try accessing restricted pages directly via URL
3. Verify navigation shows appropriate items
4. Confirm error messages for unauthorized access

## Security Features

### 1. Authentication Check
- Verifies user is logged in before checking permissions
- Redirects to login page if not authenticated
- Maintains session state across page refreshes

### 2. Role Validation
- Validates user roles against predefined list
- Handles invalid or missing roles gracefully
- **Case-insensitive role matching** for better compatibility
- Logs security events for debugging

### 3. Route Protection
- Protects against direct URL access
- Shows clear error messages for unauthorized attempts
- Provides safe navigation options (Go to Dashboard, Go Back)

### 4. Dynamic Navigation
- Navigation items are filtered server-side
- Prevents client-side manipulation
- Maintains consistent user experience

## Error Handling

### Access Denied Page
When users try to access unauthorized pages:
- Clear error message explaining lack of permission
- Shows user's current role
- Provides navigation options to go back or to dashboard
- Maintains professional appearance

### Loading States
- Shows loading spinner during authentication checks
- Prevents flash of unauthorized content
- Maintains smooth user experience

## Best Practices

### 1. Least Privilege Principle
- Users only get access to what they need
- Role hierarchy from staff (least) to admin (most)
- Regular review of role permissions

### 2. Consistent Implementation
- All admin pages use same protection mechanism
- Centralized permission management
- Consistent error messages and handling

### 3. User Experience
- Clear feedback for unauthorized access
- Intuitive navigation based on permissions
- Professional error pages

## Maintenance

### Adding New Roles
1. Add role to `UserRole` type in `rolePermissions.ts`
2. Update `isValidUserRole` function
3. Add role to relevant route permissions
4. Test with new role account

### Modifying Permissions
1. Update `adminRoutes` array in `rolePermissions.ts`
2. Test affected roles
3. Update documentation if needed

### Debugging
- Check browser console for permission-related logs
- Verify user role in database matches expected value
- Test with different role formats (case variations)

## Migration Notes

### Existing Users
- The system handles existing users automatically
- Case-insensitive matching ensures compatibility
- No database changes required for existing role values

### Database Requirements
- Ensure user.role field contains valid role values: `admin`, `sub-admin`, `manager`, `staff`
- Role field should be properly indexed for performance
- Case variations are handled automatically by the system

## Troubleshooting

### Access Denied with Valid Role
- Check if user role exactly matches database values
- Verify user is properly authenticated
- Check browser console for detailed error messages

### Navigation Not Showing Items
- Confirm user role is set correctly in database
- Check if role value has extra whitespace or special characters
- Verify `getAccessibleRoutes` function is working properly

## Conclusion

The role-based access control system provides comprehensive security for the Visitrack admin panel while maintaining ease of use. It automatically protects all admin routes, provides clear feedback for unauthorized access, and maintains a professional user experience across all role levels. The case-insensitive role checking ensures compatibility with various database configurations and prevents access issues due to case mismatches. 