# Page Access Control System

VisiTrack now features a comprehensive page-level access control system that allows granular control over which pages individual users can access, regardless of their role.

## 🎯 How It Works

### 1. **Automatic Page Access Assignment**
When users register or are created by admins, they automatically get page access fields in their database record:

```javascript
{
  "dashboard:true": true,
  "visitors:true": true,
  "events:true": true,
  "badge-management:true": true,
  "form-builder:true": true,
  "messages:true": true,
  "entry-log:true": true,
  "scanner:true": true,
  "reports:true": true,
  "setting:true": true,
  "profile:true": true
}
```

### 2. **Real-Time Access Checking**
The system checks these fields every time a user tries to access a page:
- ✅ `"dashboard:true": true` → User can access dashboard
- ❌ `"reports:true": false` → User cannot access reports

### 3. **Multiple Protection Layers**
- **Navigation Filtering**: Menu items are hidden for inaccessible pages
- **Route Protection**: Direct URL access is blocked
- **Component Guards**: Individual components can check access
- **API Protection**: Backend validates access through JWT tokens

## 🔧 Implementation Details

### Files Modified/Created:

1. **`src/lib/globalVariables.ts`** - Core page access functions
2. **`src/context/AuthContext.tsx`** - Page access integration
3. **`src/components/PageAccessGuard.tsx`** - Route protection component
4. **`src/components/AdminLayout.tsx`** - Navigation filtering
5. **`src/lib/rolePermissions.ts`** - Default access generation
6. **`src/pages/api/register.ts`** - Auto-assign page access on registration
7. **`src/pages/api/users/create.ts`** - Auto-assign page access on user creation
8. **`scripts/migrate-user-page-access.js`** - Migration for existing users

### Available Page Access Keys:
```javascript
- dashboard:true
- visitors:true
- events:true
- badge-management:true
- form-builder:true
- messages:true
- entry-log:true
- scanner:true
- reports:true
- setting:true
- profile:true
```

## 💻 Usage Examples

### 1. Check Access in Components
```javascript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { hasPageAccess } = useAuth();
  
  return (
    <div>
      {hasPageAccess('dashboard:true') && (
        <button>Go to Dashboard</button>
      )}
      {hasPageAccess('reports:true') && (
        <button>View Reports</button>
      )}
    </div>
  );
}
```

### 2. Protect Entire Pages
```javascript
import PageAccessGuard from '../components/PageAccessGuard';

function ReportsPage() {
  return (
    <PageAccessGuard requiredPageAccess="reports:true">
      <div>
        <h1>Reports Dashboard</h1>
        {/* Page content */}
      </div>
    </PageAccessGuard>
  );
}
```

### 3. Custom Access Logic
```javascript
const { user, pageAccess, canAccessReports } = useAuth();

// Quick access checkers
if (canAccessReports()) {
  // Show reports content
}

// Manual checking
if (pageAccess?.['events:true']) {
  // Show events content
}
```

## 🔄 User Management

### For New Users:
- **Registration**: All page access fields automatically set to `true`
- **Admin Creation**: All page access fields automatically set to `true`
- **Migration**: Existing users get page access fields added via migration script

### For Admins:
Admins can modify individual user page access by updating user documents in the database:

```javascript
// Example: Restrict a staff user
{
  "dashboard:true": true,    // ✅ Can access dashboard
  "visitors:true": true,     // ✅ Can access visitors
  "events:true": false,      // ❌ Cannot access events
  "reports:true": false,     // ❌ Cannot access reports
  "setting:true": false      // ❌ Cannot access settings
}
```

## 🎨 User Experience

### Navigation Menu:
- Only shows pages the user has access to
- Gracefully handles cases where users have no accessible pages
- Shows page count badge in user profile

### Access Denied:
- Clean error page with role and permission details
- Option to redirect to accessible page
- Admin contact information for permission requests

### Loading States:
- Smooth loading indicators during access checks
- No flickering or sudden redirects
- Consistent user experience across all pages

## 📊 Access Levels by Role

### Admin Users:
- ✅ All pages (11/11)
- Full system access
- Cannot be restricted by page access

### Manager Users:
- ✅ Most pages (9/11)
- ❌ Reports, Settings (role-based restriction)
- Can be further customized per individual

### Staff Users:
- ✅ Essential pages (5/11)
- ❌ Events, Badges, Forms, Messages, Reports, Settings
- Individual access can be granted by admins

## 🔒 Security Features

1. **JWT Token Validation**: Page access fields included in authentication tokens
2. **Server-Side Verification**: API endpoints validate access permissions
3. **Client-Side Protection**: Multiple layers prevent unauthorized access
4. **Audit Trail**: All access attempts logged for security monitoring
5. **Graceful Degradation**: System works even if page access data is missing

## 🚀 Migration Support

For existing installations, run the migration script:

```bash
node scripts/migrate-user-page-access.js
```

This will:
- Add page access fields to all existing users
- Set all fields to `true` by default
- Preserve existing user data
- Create backup of original data

## 🎯 Benefits

✅ **Granular Control**: Page-level access instead of just role-based  
✅ **User-Specific**: Each user can have custom access permissions  
✅ **Automatic Setup**: New users get access automatically  
✅ **Admin Flexibility**: Easy to modify access for individual users  
✅ **Secure**: Multiple protection layers prevent unauthorized access  
✅ **User-Friendly**: Clean error handling and intuitive navigation  
✅ **Performance**: Efficient access checking with minimal overhead  
✅ **Scalable**: Works with any number of users and pages  

## 🔧 Troubleshooting

### Common Issues:

1. **User sees no navigation items**:
   - Check if user has page access fields in database
   - Run migration script if upgrading from older version

2. **Access denied errors**:
   - Verify page access fields exist and are set correctly
   - Check console logs for detailed access information

3. **Navigation not filtering**:
   - Ensure AdminLayout is using updated page access system
   - Verify useAuth hook is providing page access functions

### Debug Information:
The system provides detailed console logging:
- 🔐 Page access checks
- 📋 Accessible pages list
- ⚠️ Access warnings and errors
- 🚀 User login/logout events

This page access control system provides enterprise-level security with user-friendly administration, making VisiTrack suitable for organizations with complex access requirements. 