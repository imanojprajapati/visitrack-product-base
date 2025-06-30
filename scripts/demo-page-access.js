/**
 * Page Access Control System Demo
 * 
 * This script demonstrates how the page access control system works in VisiTrack.
 * It shows how users get page access fields automatically and how the system checks access.
 */

// Import the functions (in actual use, these would be imported from the respective files)
const PAGE_ACCESS_KEYS = {
  DASHBOARD: 'dashboard:true',
  VISITORS: 'visitors:true',
  EVENTS: 'events:true',
  BADGE_MANAGEMENT: 'badge-management:true',
  FORM_BUILDER: 'form-builder:true',
  MESSAGES: 'messages:true',
  ENTRY_LOG: 'entry-log:true',
  SCANNER: 'scanner:true',
  REPORTS: 'reports:true',
  SETTINGS: 'setting:true',
  PROFILE: 'profile:true'
};

// Mock user data showing different access levels
const mockUsers = {
  admin: {
    id: '507f1f77bcf86cd799439011',
    username: 'admin_user',
    role: 'admin',
    fullName: 'Admin User',
    // Admin gets all page access (automatically added during registration/creation)
    'dashboard:true': true,
    'visitors:true': true,
    'events:true': true,
    'badge-management:true': true,
    'form-builder:true': true,
    'messages:true': true,
    'entry-log:true': true,
    'scanner:true': true,
    'reports:true': true,
    'setting:true': true,
    'profile:true': true
  },
  
  staff: {
    id: '507f1f77bcf86cd799439012',
    username: 'staff_user',
    role: 'staff',
    fullName: 'Staff User',
    // Staff gets limited access (admin can modify these fields)
    'dashboard:true': true,
    'visitors:true': true,
    'events:true': false,        // No access to events
    'badge-management:true': false, // No access to badges
    'form-builder:true': false,  // No access to forms
    'messages:true': false,      // No access to messages
    'entry-log:true': true,
    'scanner:true': true,
    'reports:true': false,       // No access to reports
    'setting:true': false,       // No access to settings
    'profile:true': true
  },
  
  manager: {
    id: '507f1f77bcf86cd799439013',
    username: 'manager_user',
    role: 'manager',
    fullName: 'Manager User',
    // Manager gets most access but not settings
    'dashboard:true': true,
    'visitors:true': true,
    'events:true': true,
    'badge-management:true': true,
    'form-builder:true': true,
    'messages:true': true,
    'entry-log:true': true,
    'scanner:true': true,
    'reports:true': false,       // No access to reports (Role-based restriction)
    'setting:true': false,       // No access to settings (Role-based restriction)
    'profile:true': true
  }
};

/**
 * Extract page access from user data
 */
function extractPageAccess(userData) {
  const pageAccess = {};
  Object.keys(userData).forEach(key => {
    if (key.endsWith(':true') && typeof userData[key] === 'boolean') {
      pageAccess[key] = userData[key];
    }
  });
  return pageAccess;
}

/**
 * Check if user has access to a specific page
 */
function hasPageAccess(userPageAccess, pageKey) {
  return userPageAccess[pageKey] === true;
}

/**
 * Get accessible pages for a user
 */
function getAccessiblePages(userPageAccess) {
  const pagePaths = {
    'dashboard:true': '/admin',
    'visitors:true': '/admin/visitors',
    'events:true': '/admin/events',
    'badge-management:true': '/admin/badge-management',
    'form-builder:true': '/admin/forms',
    'messages:true': '/admin/messages',
    'entry-log:true': '/admin/entry-log',
    'scanner:true': '/admin/scanner',
    'reports:true': '/admin/reports',
    'setting:true': '/admin/settings',
    'profile:true': '/admin/profile'
  };

  return Object.entries(pagePaths)
    .filter(([pageKey]) => userPageAccess[pageKey] === true)
    .map(([, path]) => path);
}

/**
 * Generate default page access (all true) for new users
 */
function generateDefaultPageAccess() {
  const pageAccess = {};
  Object.values(PAGE_ACCESS_KEYS).forEach(key => {
    pageAccess[key] = true;
  });
  return pageAccess;
}

/**
 * Demo function to show how the system works
 */
function demonstratePageAccessSystem() {
  console.log('🔐 VisiTrack Page Access Control System Demo');
  console.log('===========================================\n');

  // Show how new users get default access
  console.log('📝 1. New User Registration/Creation:');
  const defaultAccess = generateDefaultPageAccess();
  console.log('   → All new users automatically get these page access fields:');
  Object.entries(defaultAccess).forEach(([key, value]) => {
    console.log(`     ${key}: ${value}`);
  });
  console.log('   → Admins can later modify these fields for individual users\n');

  // Demo each user type
  Object.entries(mockUsers).forEach(([userType, userData]) => {
    console.log(`👤 ${userType.toUpperCase()} USER DEMO:`);
    console.log(`   Name: ${userData.fullName}`);
    console.log(`   Role: ${userData.role}`);
    
    const pageAccess = extractPageAccess(userData);
    const accessiblePages = getAccessiblePages(pageAccess);
    
    console.log(`   Page Access Fields: ${Object.keys(pageAccess).length}`);
    console.log('   Permissions:');
    Object.entries(pageAccess).forEach(([key, value]) => {
      const status = value ? '✅ ALLOWED' : '❌ DENIED';
      const pageName = key.replace(':true', '').replace('-', ' ').toUpperCase();
      console.log(`     ${pageName}: ${status}`);
    });
    
    console.log(`   Accessible Pages (${accessiblePages.length}):`);
    accessiblePages.forEach(page => {
      console.log(`     → ${page}`);
    });
    console.log('');
  });

  // Show how access checking works in practice
  console.log('🔍 PRACTICAL EXAMPLES:');
  console.log('');

  const testScenarios = [
    { user: 'admin', page: PAGE_ACCESS_KEYS.REPORTS, description: 'Admin accessing Reports' },
    { user: 'staff', page: PAGE_ACCESS_KEYS.REPORTS, description: 'Staff trying to access Reports' },
    { user: 'manager', page: PAGE_ACCESS_KEYS.EVENTS, description: 'Manager accessing Events' },
    { user: 'staff', page: PAGE_ACCESS_KEYS.DASHBOARD, description: 'Staff accessing Dashboard' },
    { user: 'staff', page: PAGE_ACCESS_KEYS.SETTINGS, description: 'Staff trying to access Settings' }
  ];

  testScenarios.forEach(scenario => {
    const userData = mockUsers[scenario.user];
    const pageAccess = extractPageAccess(userData);
    const hasAccess = hasPageAccess(pageAccess, scenario.page);
    const result = hasAccess ? '✅ ALLOWED' : '❌ BLOCKED';
    
    console.log(`   ${scenario.description}: ${result}`);
    if (!hasAccess) {
      console.log(`     → User will be redirected or see access denied page`);
    }
  });

  console.log('\n🎯 SYSTEM BENEFITS:');
  console.log('   ✅ Individual page-level access control');
  console.log('   ✅ Automatic setup for new users');
  console.log('   ✅ Admin can customize access per user');
  console.log('   ✅ Works alongside role-based permissions');
  console.log('   ✅ Real-time access checking');
  console.log('   ✅ Graceful handling of access denial');
  console.log('   ✅ Navigation menu filters based on access');
  console.log('   ✅ Backend API protection through JWT validation');

  console.log('\n📋 USAGE IN CODE:');
  console.log('   // Check access in components');
  console.log('   const { hasPageAccess } = useAuth();');
  console.log('   if (hasPageAccess("dashboard:true")) {');
  console.log('     // Show dashboard content');
  console.log('   }');
  console.log('');
  console.log('   // Protect entire pages');
  console.log('   <PageAccessGuard requiredPageAccess="reports:true">');
  console.log('     <ReportsPage />');
  console.log('   </PageAccessGuard>');
  console.log('');
  console.log('   // Filter navigation');
  console.log('   const navigation = routes.filter(route => {');
  console.log('     return hasPageAccess(getPageAccessKey(route.path));');
  console.log('   });');
}

// Run the demo
demonstratePageAccessSystem();

module.exports = {
  demonstratePageAccessSystem,
  mockUsers,
  PAGE_ACCESS_KEYS,
  extractPageAccess,
  hasPageAccess,
  getAccessiblePages,
  generateDefaultPageAccess
}; 