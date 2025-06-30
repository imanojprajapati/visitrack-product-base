import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

interface SuperAdmin {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: 'superadmin';
  permissions: {
    viewAllData: boolean;
    manageAllUsers: boolean;
    manageAllEvents: boolean;
    manageAllVisitors: boolean;
    systemSettings: boolean;
    analytics: boolean;
    reports: boolean;
  };
  isActive: boolean;
  emailVerified: boolean;
}

interface SuperAdminContextType {
  superAdmin: SuperAdmin | null;
  token: string | null;
  // Super Admin specific data
  fullName: string | null;
  email: string | null;
  username: string | null;
  permissions: SuperAdmin['permissions'] | null;
  // Methods
  login: (superAdminData: SuperAdmin, authToken: string) => void;
  logout: () => void;
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  // System stats
  systemStats: {
    totalUsers: number;
    totalOrganizations: number;
    totalEvents: number;
    totalVisitors: number;
  } | null;
  refreshSystemStats: () => Promise<void>;
}

const SuperAdminContext = createContext<SuperAdminContextType | undefined>(undefined);

export const useSuperAdmin = () => {
  const context = useContext(SuperAdminContext);
  if (context === undefined) {
    throw new Error('useSuperAdmin must be used within a SuperAdminProvider');
  }
  return context;
};

interface SuperAdminProviderProps {
  children: ReactNode;
}

export const SuperAdminProvider: React.FC<SuperAdminProviderProps> = ({ children }) => {
  const [superAdmin, setSuperAdmin] = useState<SuperAdmin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStats, setSystemStats] = useState<SuperAdminContextType['systemStats']>(null);
  const router = useRouter();

  // Extract super admin properties
  const fullName = superAdmin?.fullName || null;
  const email = superAdmin?.email || null;
  const username = superAdmin?.username || null;
  const permissions = superAdmin?.permissions || null;
  const isAuthenticated = !!superAdmin && !!token;

  // Load super admin data from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('superAdminToken');
    const savedSuperAdmin = localStorage.getItem('superAdminData');

    if (savedToken && savedSuperAdmin) {
      try {
        const superAdminData = JSON.parse(savedSuperAdmin);
        setToken(savedToken);
        setSuperAdmin(superAdminData);
        
        console.log('👑 Restored super admin session:', {
          username: superAdminData.username,
          email: superAdminData.email,
          permissions: superAdminData.permissions
        });
      } catch (error) {
        console.error('Error parsing saved super admin data:', error);
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdminData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (superAdminData: SuperAdmin, authToken: string) => {
    setSuperAdmin(superAdminData);
    setToken(authToken);
    
    // Save to localStorage with different keys than regular admin
    localStorage.setItem('superAdminToken', authToken);
    localStorage.setItem('superAdminData', JSON.stringify(superAdminData));
    
    console.log('👑 Super Admin Login Complete:', {
      username: superAdminData.username,
      email: superAdminData.email,
      permissions: superAdminData.permissions,
      loginTime: new Date().toISOString()
    });

    // Refresh system stats after login
    refreshSystemStats();
  };

  const logout = () => {
    const previousUser = superAdmin?.username || 'Unknown';
    
    setSuperAdmin(null);
    setToken(null);
    setSystemStats(null);
    
    // Clear localStorage
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('superAdminData');
    
    console.log('👑 Super Admin Logout:', {
      previousUser,
      logoutTime: new Date().toISOString()
    });
    
    // Redirect to super admin login
    router.push('/superadmin/login');
  };

  // Fetch system-wide statistics
  const refreshSystemStats = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/superadmin/system-stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const stats = await response.json();
        setSystemStats(stats);
        console.log('📊 System stats refreshed:', stats);
      } else {
        console.error('Failed to fetch system stats:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  };

  // Set up API interceptor for super admin requests
  useEffect(() => {
    if (token) {
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        // Only intercept super admin API calls
        if (typeof url === 'string' && url.startsWith('/api/superadmin/')) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return originalFetch(url, options);
      };
      
      console.log('🔗 Super Admin API interceptor configured');
    }
  }, [token]);

  // Log super admin state changes for debugging
  useEffect(() => {
    if (superAdmin) {
      console.log('👑 Super Admin State Change:', {
        username: superAdmin.username,
        email: superAdmin.email,
        isAuthenticated,
        permissions: superAdmin.permissions,
        timestamp: new Date().toISOString()
      });
    }
  }, [superAdmin, isAuthenticated]);

  const value: SuperAdminContextType = {
    superAdmin,
    token,
    fullName,
    email,
    username,
    permissions,
    login,
    logout,
    isAuthenticated,
    isLoading,
    systemStats,
    refreshSystemStats,
  };

  return (
    <SuperAdminContext.Provider value={value}>
      {children}
    </SuperAdminContext.Provider>
  );
}; 