export type UserRole = 'admin' | 'sub-admin' | 'manager' | 'staff';

export interface RoutePermission {
  path: string;
  name: string;
  icon: string;
  allowedRoles: UserRole[];
}

export const adminRoutes: RoutePermission[] = [
  {
    path: '/admin',
    name: 'Dashboard',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
    allowedRoles: ['admin', 'sub-admin', 'manager', 'staff']
  },
  {
    path: '/admin/visitors',
    name: 'Visitor Management',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    allowedRoles: ['admin', 'sub-admin', 'manager', 'staff']
  },
  {
    path: '/admin/events',
    name: 'Event Management',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    allowedRoles: ['admin', 'sub-admin', 'manager']
  },
  {
    path: '/admin/badge-management',
    name: 'Badge Management',
    icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    allowedRoles: ['admin', 'sub-admin', 'manager']
  },
  {
    path: '/admin/forms',
    name: 'Form Builder',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01',
    allowedRoles: ['admin', 'sub-admin', 'manager']
  },
  {
    path: '/admin/messages',
    name: 'Messages',
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    allowedRoles: ['admin', 'sub-admin', 'manager']
  },
  {
    path: '/admin/entry-log',
    name: 'Entry Log',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    allowedRoles: ['admin', 'sub-admin', 'manager', 'staff']
  },
  {
    path: '/admin/scanner',
    name: 'Quick Scanner',
    icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4M4 8h4m0 0V4m0 4h4m0 0v4m0 0h4m-4 4v4',
    allowedRoles: ['admin', 'sub-admin', 'manager', 'staff']
  },
  {
    path: '/admin/reports',
    name: 'Report',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    allowedRoles: ['admin', 'sub-admin']
  },
  {
    path: '/admin/settings',
    name: 'Setting',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
    allowedRoles: ['admin', 'sub-admin']
  },
  {
    path: '/admin/profile',
    name: 'Profile',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    allowedRoles: ['admin', 'sub-admin', 'manager', 'staff']
  }
];

// Utility functions with case-insensitive checking
export const hasPermission = (userRole: string, routePath: string): boolean => {
  const route = adminRoutes.find(r => r.path === routePath);
  if (!route) return false;
  
  // Normalize role to lowercase for comparison
  const normalizedUserRole = userRole?.toLowerCase().trim();
  return route.allowedRoles.some(allowedRole => 
    allowedRole.toLowerCase() === normalizedUserRole
  );
};

export const getAccessibleRoutes = (userRole: string): RoutePermission[] => {
  if (!userRole) return [];
  
  // Normalize role to lowercase for comparison
  const normalizedUserRole = userRole.toLowerCase().trim();
  return adminRoutes.filter(route => 
    route.allowedRoles.some(allowedRole => 
      allowedRole.toLowerCase() === normalizedUserRole
    )
  );
};

export const isValidUserRole = (role: string): role is UserRole => {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().trim();
  return ['admin', 'sub-admin', 'manager', 'staff'].includes(normalizedRole);
}; 