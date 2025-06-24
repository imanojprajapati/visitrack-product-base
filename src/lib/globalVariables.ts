// Global Variables Utility - Demonstrates dynamic user context flow
export interface GlobalVariables {
  userId: string | null;
  ownerId: string | null;
  username: string | null;
  role: string | null;
  email: string | null;
  fullName: string | null;
}

export interface UserLoginScenario {
  username: string;
  ownerId: string;
  userId: string;
  role: string;
  email: string;
  fullName: string;
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
 * Logs current global variable state
 */
export function logGlobalVariables(vars: GlobalVariables, context: string = 'Current') {
  console.log(`📊 ${context} Global Variables:`, {
    userId: vars.userId,
    ownerId: vars.ownerId,
    username: vars.username,
    role: vars.role,
    email: vars.email,
    fullName: vars.fullName,
    timestamp: new Date().toISOString()
  });
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
  exampleScenarios,
  demonstrateGlobalVariableFlow,
  validateGlobalVariables,
  logGlobalVariables,
  simulateEventCreation
}; 