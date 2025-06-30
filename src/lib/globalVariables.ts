// Global Variables Utility - Demonstrates dynamic user context flow
export interface GlobalVariables {
  userId: string | null;
  ownerId: string | null;
  username: string | null;
  role: string | null;
  email: string | null;
  fullName: string | null;
  pageAccess?: Record<string, boolean>; // Page access permissions
}

export interface UserLoginScenario {
  username: string;
  ownerId: string;
  userId: string;
  role: string;
  email: string;
  fullName: string;
}

// Page Access Constants - All available pages in the system
export const PAGE_ACCESS_KEYS = {
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
} as const;

// Page to Path Mapping
export const PAGE_PATHS = {
  [PAGE_ACCESS_KEYS.DASHBOARD]: '/admin',
  [PAGE_ACCESS_KEYS.VISITORS]: '/admin/visitors',
  [PAGE_ACCESS_KEYS.EVENTS]: '/admin/events',
  [PAGE_ACCESS_KEYS.BADGE_MANAGEMENT]: '/admin/badge-management',
  [PAGE_ACCESS_KEYS.FORM_BUILDER]: '/admin/forms',
  [PAGE_ACCESS_KEYS.MESSAGES]: '/admin/messages',
  [PAGE_ACCESS_KEYS.ENTRY_LOG]: '/admin/entry-log',
  [PAGE_ACCESS_KEYS.SCANNER]: '/admin/scanner',
  [PAGE_ACCESS_KEYS.REPORTS]: '/admin/reports',
  [PAGE_ACCESS_KEYS.SETTINGS]: '/admin/settings',
  [PAGE_ACCESS_KEYS.PROFILE]: '/admin/profile'
} as const;

/**
 * Check if user has access to a specific page
 * @param userPageAccess - User's page access object from database
 * @param pageKey - Page access key (e.g., 'dashboard:true')
 * @returns boolean - true if user has access, false otherwise
 */
export function hasPageAccess(userPageAccess: Record<string, boolean> | undefined, pageKey: string): boolean {
  if (!userPageAccess) {
    console.warn('⚠️ No page access data found for user');
    return false;
  }
  
  const hasAccess = userPageAccess[pageKey] === true;
  console.log(`🔐 Page Access Check: ${pageKey} = ${hasAccess}`);
  return hasAccess;
}

/**
 * Check if user can access a page by its path
 * @param userPageAccess - User's page access object from database
 * @param pagePath - Page path (e.g., '/admin/dashboard')
 * @returns boolean - true if user has access, false otherwise
 */
export function hasPageAccessByPath(userPageAccess: Record<string, boolean> | undefined, pagePath: string): boolean {
  // Find the page access key for this path
  const pageAccessKey = Object.entries(PAGE_PATHS).find(([key, path]) => path === pagePath)?.[0];
  
  if (!pageAccessKey) {
    console.warn(`⚠️ No page access key found for path: ${pagePath}`);
    return false;
  }
  
  return hasPageAccess(userPageAccess, pageAccessKey);
}

/**
 * Get all accessible pages for a user
 * @param userPageAccess - User's page access object from database
 * @returns Array of page paths the user can access
 */
export function getAccessiblePages(userPageAccess: Record<string, boolean> | undefined): string[] {
  if (!userPageAccess) return [];
  
  const accessiblePages = Object.entries(PAGE_PATHS)
    .filter(([pageKey]) => userPageAccess[pageKey] === true)
    .map(([, path]) => path);
  
  console.log('📋 Accessible pages for user:', accessiblePages);
  return accessiblePages;
}

/**
 * Generate default page access for new users (all pages = true)
 */
export function generateDefaultPageAccess(): Record<string, boolean> {
  const pageAccess: Record<string, boolean> = {};
  Object.values(PAGE_ACCESS_KEYS).forEach(key => {
    pageAccess[key] = true;
  });
  return pageAccess;
}

/**
 * Validate page access format
 */
export function validatePageAccess(pageAccess: any): boolean {
  if (!pageAccess || typeof pageAccess !== 'object') return false;
  
  const validKeys = Object.values(PAGE_ACCESS_KEYS);
  return Object.keys(pageAccess).every(key => validKeys.includes(key as any));
}

// Example scenarios demonstrating global variable updates
export const exampleScenarios: Record<string, UserLoginScenario> = {
  john: {
    username: 'john_doe',
    ownerId: '57947',
    userId: '507f1f77bcf86cd799439011',
    role: 'admin',
    email: 'john@example.com',
    fullName: 'John Doe'
  },
  tom: {
    username: 'tom_smith',
    ownerId: '67984',
    userId: '507f1f77bcf86cd799439012',
    role: 'user',
    email: 'tom@example.com',
    fullName: 'Tom Smith'
  },
  alice: {
    username: 'alice_wilson',
    ownerId: '78356',
    userId: '507f1f77bcf86cd799439013',
    role: 'manager',
    email: 'alice@example.com',
    fullName: 'Alice Wilson'
  }
};

/**
 * Demonstrates how global variables change when different users log in
 */
export function demonstrateGlobalVariableFlow() {
  console.log('🎯 Global Variable Flow Demonstration:');
  console.log('=====================================');
  
  Object.entries(exampleScenarios).forEach(([name, scenario]) => {
    console.log(`\n📋 When ${scenario.fullName} logs in:`);
    console.log('  Global Variables Update To:');
    console.log(`    userId: "${scenario.userId}"`);
    console.log(`    ownerId: "${scenario.ownerId}"`);
    console.log(`    username: "${scenario.username}"`);
    console.log(`    role: "${scenario.role}"`);
    console.log(`    email: "${scenario.email}"`);
    console.log(`    fullName: "${scenario.fullName}"`);
    console.log(`\n  🎪 When ${scenario.fullName} creates an event:`);
    console.log(`    → Event gets ownerId: "${scenario.ownerId}"`);
    console.log(`    → Event created by: "${scenario.username}"`);
    console.log(`    → Only ${scenario.fullName} can see/edit this event`);
  });
  
  console.log('\n🔒 Security & Isolation:');
  console.log('  ✅ Each user only sees events with their ownerId');
  console.log('  ✅ Global variables update automatically on login');
  console.log('  ✅ JWT token contains user-specific global variables');
  console.log('  ✅ API endpoints validate ownerId from token');
}

/**
 * Demonstrates page access checking functionality
 */
export function demonstratePageAccessFlow() {
  console.log('\n🔐 Page Access Flow Demonstration:');
  console.log('=====================================');
  
  // Example user page access data
  const staffPageAccess = {
    'dashboard:true': true,
    'visitors:true': true,
    'entry-log:true': true,
    'scanner:true': true,
    'profile:true': true,
    'events:true': false,
    'reports:true': false,
    'setting:true': false
  };
  
  const adminPageAccess = generateDefaultPageAccess();
  
  console.log('\n👤 Staff User Page Access Example:');
  console.log('  Dashboard access:', hasPageAccess(staffPageAccess, PAGE_ACCESS_KEYS.DASHBOARD));
  console.log('  Events access:', hasPageAccess(staffPageAccess, PAGE_ACCESS_KEYS.EVENTS));
  console.log('  Reports access:', hasPageAccess(staffPageAccess, PAGE_ACCESS_KEYS.REPORTS));
  
  console.log('\n👑 Admin User Page Access Example:');
  console.log('  Dashboard access:', hasPageAccess(adminPageAccess, PAGE_ACCESS_KEYS.DASHBOARD));
  console.log('  Events access:', hasPageAccess(adminPageAccess, PAGE_ACCESS_KEYS.EVENTS));
  console.log('  Reports access:', hasPageAccess(adminPageAccess, PAGE_ACCESS_KEYS.REPORTS));
  
  console.log('\n📄 Accessible pages for staff:', getAccessiblePages(staffPageAccess));
  console.log('📄 Accessible pages for admin:', getAccessiblePages(adminPageAccess));
}

/**
 * Validates that all required global variables are present
 */
export function validateGlobalVariables(vars: Partial<GlobalVariables>): boolean {
  const required = ['userId', 'ownerId', 'username', 'role', 'email'];
  const missing = required.filter(key => !vars[key as keyof GlobalVariables]);
  
  if (missing.length > 0) {
    console.error('❌ Missing global variables:', missing);
    return false;
  }
  
  console.log('✅ All global variables validated successfully');
  return true;
}

/**
 * Logs current global variable state including page access
 */
export function logGlobalVariables(vars: GlobalVariables, context: string = 'Current') {
  console.log(`📊 ${context} Global Variables:`, {
    userId: vars.userId,
    ownerId: vars.ownerId,
    username: vars.username,
    role: vars.role,
    email: vars.email,
    fullName: vars.fullName,
    pageAccessCount: vars.pageAccess ? Object.keys(vars.pageAccess).length : 0,
    timestamp: new Date().toISOString()
  });
  
  if (vars.pageAccess) {
    console.log(`🔐 ${context} Page Access:`, vars.pageAccess);
  }
}

/**
 * Simulates event creation with global variables
 */
export function simulateEventCreation(vars: GlobalVariables, eventName: string) {
  if (!validateGlobalVariables(vars)) {
    throw new Error('Cannot create event: Invalid global variables');
  }
  
  const eventData = {
    ownerId: vars.ownerId, // Global variable - ensures event belongs to current user
    eventName,
    createdBy: {
      userId: vars.userId,
      username: vars.username,
      email: vars.email,
      role: vars.role
    },
    createdAt: new Date().toISOString()
  };
  
  console.log('🎪 Event Creation Simulation:', {
    eventName,
    assignedOwnerId: vars.ownerId,
    createdByUser: vars.username,
    eventData
  });
  
  return eventData;
}

export default {
  PAGE_ACCESS_KEYS,
  PAGE_PATHS,
  hasPageAccess,
  hasPageAccessByPath,
  getAccessiblePages,
  generateDefaultPageAccess,
  validatePageAccess,
  exampleScenarios,
  demonstrateGlobalVariableFlow,
  demonstratePageAccessFlow,
  validateGlobalVariables,
  logGlobalVariables,
  simulateEventCreation
}; 