# Super Admin System Documentation

VisiTrack now includes a comprehensive Super Admin system that provides system-wide access and management capabilities across all organizations without any ownerId filtering.

## 🎯 Key Differences: Regular Admin vs Super Admin

### Regular Admin (/admin)
- **Filtered by ownerId**: Only sees data from their own organization
- **Limited scope**: Users, events, visitors within their organization
- **Authentication**: Uses `users` collection
- **Access**: Organization-specific dashboard and management

### Super Admin (/superadmin)
- **No ownerId filtering**: Sees ALL data across ALL organizations  
- **Global scope**: System-wide users, events, visitors, analytics
- **Authentication**: Uses separate `superadmins` collection
- **Access**: System-wide dashboard and management

## 🔧 Implementation Details

### 1. Database Setup

**New Collection Created:**
```javascript
// superadmins collection
{
  fullName: "Super Administrator",
  email: "superadmin@visitrack.com", 
  username: "superadmin",
  password: "hashed_password",
  role: "superadmin",
  permissions: {
    viewAllData: true,
    manageAllUsers: true,
    manageAllEvents: true,
    manageAllVisitors: true,
    systemSettings: true,
    analytics: true,
    reports: true
  },
  isActive: true,
  emailVerified: true
}
```

**Default Super Admin Credentials:**
- Email: `superadmin@visitrack.com`
- Username: `superadmin`
- Password: `SuperAdmin123!`

### 2. Architecture Components

#### Files Created/Modified:

1. **`scripts/create-superadmin.js`** - Setup script for super admin system
2. **`src/context/SuperAdminContext.tsx`** - Separate authentication context
3. **`src/pages/api/superadmin/login.ts`** - Super admin login API
4. **`src/pages/api/superadmin/system-stats.ts`** - System-wide statistics API
5. **`src/pages/api/superadmin/users.ts`** - All users API (no ownerId filter)
6. **`src/pages/superadmin/login.tsx`** - Super admin login page
7. **`src/pages/superadmin/index.tsx`** - Super admin dashboard
8. **`src/pages/superadmin/users.tsx`** - All users management page
9. **`src/components/SuperAdminLayout.tsx`** - Super admin layout component
10. **`src/pages/_app.tsx`** - Added SuperAdminProvider

### 3. Authentication Flow

#### Super Admin Login Process:
1. Access `/superadmin/login`
2. Authenticate against `superadmins` collection
3. Generate JWT with super admin permissions
4. Store in separate localStorage keys (`superAdminToken`, `superAdminData`)
5. Access super admin dashboard at `/superadmin`

#### Security Features:
- Separate JWT tokens for super admin vs regular admin
- Permission-based access control
- 24-hour token expiration
- Encrypted password storage with bcrypt

## 🌐 Super Admin Features

### Dashboard (`/superadmin`)
- **System-wide statistics**: Total users, organizations, events, visitors
- **Real-time metrics**: Active users, growth charts, top organizations
- **Recent activity**: Latest users and events across all organizations
- **System health**: Database metrics, collection counts, performance data

### All Users Management (`/superadmin/users`)
- **Global user view**: ALL users from ALL organizations
- **Advanced filtering**: By role, organization, search terms
- **Organization insights**: User distribution across organizations
- **No ownerId restrictions**: Can see and manage any user

### Navigation Structure:
```
/superadmin/
├── Dashboard (System Overview)
├── All Users (Global User Management)
├── All Events (Global Event Management) 
├── All Visitors (Global Visitor Management)
├── Organizations (Organization Management)
├── System Analytics (Platform Analytics)
├── System Reports (Global Reporting)
└── System Settings (Platform Configuration)
```

## 🔍 API Differences

### Regular Admin API Example:
```javascript
// /api/users.ts - Filtered by ownerId
const users = await db.collection('users').find({
  ownerId: userInfo.ownerId  // ← Limited to user's organization
}).toArray();
```

### Super Admin API Example:
```javascript
// /api/superadmin/users.ts - No ownerId filtering
const users = await db.collection('users').find({
  // No ownerId filter - shows ALL users across ALL organizations
}).toArray();
```

## 🚀 Setup Instructions

### 1. Run Setup Script:
```bash
node scripts/create-superadmin.js
```

This will:
- Create `superadmins` collection
- Create default super admin user
- Set up proper indexes
- Display system statistics

### 2. Access Super Admin:
- URL: `http://localhost:3000/superadmin/login`
- Username: `superadmin`
- Password: `SuperAdmin123!`

### 3. Change Default Password:
⚠️ **Important**: Change the default password after first login for security.

## 📊 System Statistics Example

After setup, you'll see system-wide data like:
```
📊 System Statistics:
==================
👥 Total Users: 10
🏢 Organizations: 6  
🎪 Total Events: 4
👤 Total Visitors: 25
👑 Super Admins: 1
```

## 🔐 Security Considerations

### Separation of Concerns:
- **Different Collections**: `users` vs `superadmins`
- **Different JWT Tokens**: Regular vs super admin authentication
- **Different Storage Keys**: Prevents authentication conflicts
- **Permission Validation**: Each API endpoint verifies super admin permissions

### Access Control:
```javascript
// Super admin permission check
if (!superAdminInfo.permissions.viewAllData) {
  return res.status(403).json({ message: 'Insufficient permissions' });
}
```

## 🎯 Use Cases

### When to Use Super Admin:
1. **System Monitoring**: Overall platform health and usage
2. **Cross-Organization Support**: Help users across different organizations
3. **Data Analysis**: Platform-wide analytics and reporting
4. **System Maintenance**: Database management and cleanup
5. **Compliance**: Audit trails and data governance

### When to Use Regular Admin:
1. **Organization Management**: Manage users within your organization
2. **Event Management**: Create and manage your organization's events
3. **Daily Operations**: Regular business activities within your scope

## 🔄 Migration Support

The system is designed to work alongside existing regular admin functionality:
- No impact on existing `/admin` pages
- Existing users and data remain unchanged
- Super admin is additive functionality
- Can be disabled by removing super admin users

## 📋 Super Admin Navigation vs Regular Admin

### Regular Admin (/admin):
- Dashboard (Organization-specific)
- Visitors (ownerId filtered)
- Events (ownerId filtered)
- Badge Management (ownerId filtered)
- Form Builder (ownerId filtered)
- Messages (ownerId filtered)
- Entry Log (ownerId filtered)
- Scanner (ownerId filtered)
- Reports (ownerId filtered)
- Settings (Organization settings)
- Profile (User profile)

### Super Admin (/superadmin):
- Dashboard (System-wide overview)
- All Users (Global, no filtering)
- All Events (Global, no filtering)
- All Visitors (Global, no filtering)
- Organizations (Organization management)
- System Analytics (Platform analytics)
- System Reports (Global reporting)
- System Settings (Platform configuration)

## ✅ Verification Steps

1. **Setup Verification**: Run setup script successfully
2. **Login Test**: Access `/superadmin/login` with default credentials
3. **Data Verification**: Confirm system stats show all organizations
4. **API Testing**: Verify `/api/superadmin/users` returns users from all organizations
5. **Navigation Test**: Confirm all super admin pages are accessible

This Super Admin system provides enterprise-level platform management capabilities while maintaining complete separation from organization-specific admin functionality. 