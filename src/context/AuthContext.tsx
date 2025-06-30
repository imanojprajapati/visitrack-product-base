import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { 
  hasPageAccess, 
  hasPageAccessByPath, 
  getAccessiblePages, 
  PAGE_ACCESS_KEYS,
  PAGE_PATHS,
  validatePageAccess 
} from '../lib/globalVariables';

interface User {
  id: string;
  ownerId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  username: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  // Page access fields (dynamically added from database)
  [key: string]: any; // This allows for dynamic page access fields like "dashboard:true", "events:true", etc.
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  // Global Variables - These update dynamically based on who logs in
  username: string | null;
  role: string | null;
  ownerId: string | null;
  userId: string | null;
  email: string | null;
  fullName: string | null;
  pageAccess: Record<string, boolean> | null; // User's page access permissions
  // Page Access Methods
  hasPageAccess: (pageKey: string) => boolean;
  hasPageAccessByPath: (pagePath: string) => boolean;
  getAccessiblePages: () => string[];
  canAccessDashboard: () => boolean;
  canAccessEvents: () => boolean;
  canAccessReports: () => boolean;
  canAccessSettings: () => boolean;
  // General Methods
  login: (userData: User, authToken: string) => void;
  logout: () => void;
  refreshGlobalVariables: () => void;
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 🌟 Dynamic Global Variables - These update automatically when different users log in
  const username = user?.username || null;
  const role = user?.role || null;
  const ownerId = user?.ownerId || null;
  const userId = user?.id || null;
  const email = user?.email || null;
  const fullName = user?.fullName || null;
  const isAuthenticated = !!user && !!token;

  // 🔐 Extract page access from user data
  const pageAccess: Record<string, boolean> | null = user ? extractPageAccessFromUser(user) : null;

  /**
   * Extract page access fields from user object
   */
  function extractPageAccessFromUser(userData: User): Record<string, boolean> {
    const pageAccessData: Record<string, boolean> = {};
    
    // Extract all page access fields (format: "dashboard:true": true)
    Object.keys(userData).forEach(key => {
      if (key.endsWith(':true') && typeof userData[key] === 'boolean') {
        pageAccessData[key] = userData[key];
      }
    });
    
    console.log('🔐 Extracted page access from user:', pageAccessData);
    return pageAccessData;
  }

  // 🔐 Page Access Methods
  const checkPageAccess = (pageKey: string): boolean => {
    if (!pageAccess) {
      console.warn('⚠️ No page access data available');
      return false;
    }
    return hasPageAccess(pageAccess, pageKey);
  };

  const checkPageAccessByPath = (pagePath: string): boolean => {
    if (!pageAccess) {
      console.warn('⚠️ No page access data available');
      return false;
    }
    return hasPageAccessByPath(pageAccess, pagePath);
  };

  const getUserAccessiblePages = (): string[] => {
    if (!pageAccess) return [];
    return getAccessiblePages(pageAccess);
  };

  // 🔐 Specific Page Access Helpers
  const canAccessDashboard = () => checkPageAccess(PAGE_ACCESS_KEYS.DASHBOARD);
  const canAccessEvents = () => checkPageAccess(PAGE_ACCESS_KEYS.EVENTS);
  const canAccessReports = () => checkPageAccess(PAGE_ACCESS_KEYS.REPORTS);
  const canAccessSettings = () => checkPageAccess(PAGE_ACCESS_KEYS.SETTINGS);

  // Function to refresh global variables (useful for debugging)
  const refreshGlobalVariables = () => {
    console.log('🔄 Current Global Variables:', {
      userId: user?.id || null,
      ownerId: user?.ownerId || null,
      username: user?.username || null,
      role: user?.role || null,
      email: user?.email || null,
      fullName: user?.fullName || null,
      pageAccess: pageAccess,
      isAuthenticated: !!user && !!token,
      timestamp: new Date().toISOString()
    });
  };

  // Load user data from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('userData');

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        
        const userPageAccess = extractPageAccessFromUser(userData);
        
        console.log('🔐 Restored user session - Global Variables loaded:', {
          userId: userData.id,
          ownerId: userData.ownerId,
          username: userData.username,
          role: userData.role,
          email: userData.email,
          pageAccessFields: Object.keys(userPageAccess).length
        });
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    
    // Save to localStorage
    localStorage.setItem('authToken', authToken);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    const userPageAccess = extractPageAccessFromUser(userData);
    
    // 🎯 Log when global variables are updated during login
    console.log('🚀 User Login Complete - Global Variables Updated:', {
      previousUser: user?.username || 'None',
      newUser: userData.username,
      globalVariables: {
        userId: userData.id,
        ownerId: userData.ownerId,
        username: userData.username,
        role: userData.role,
        email: userData.email,
        fullName: userData.fullName
      },
      pageAccess: userPageAccess,
      accessiblePages: getAccessiblePages(userPageAccess),
      loginTime: new Date().toISOString()
    });
  };

  const logout = () => {
    const previousUser = user?.username || 'Unknown';
    
    setUser(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    
    console.log('🔓 User Logout - Global Variables Cleared:', {
      previousUser,
      globalVariablesNowNull: true,
      pageAccessCleared: true,
      logoutTime: new Date().toISOString()
    });
    
    // Redirect to login
    router.push('/login');
  };

  // Auth interceptor for API calls
  useEffect(() => {
    if (token) {
      // Set default headers for API calls
      const originalFetch = window.fetch;
      window.fetch = function(url, options = {}) {
        if (typeof url === 'string' && url.startsWith('/api/')) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
          };
        }
        return originalFetch(url, options);
      };
      
      console.log('🔗 API interceptor configured for user:', {
        userId: user?.id,
        ownerId: user?.ownerId,
        username: user?.username
      });
    }
  }, [token, user]);

  // Log global variable changes for debugging
  useEffect(() => {
    if (user) {
      console.log('📊 Global Variables State Change:', {
        userId: user.id,
        ownerId: user.ownerId,
        username: user.username,
        role: user.role,
        email: user.email,
        isAuthenticated,
        pageAccessAvailable: !!pageAccess,
        pageAccessCount: pageAccess ? Object.keys(pageAccess).length : 0,
        timestamp: new Date().toISOString()
      });

      // Validate page access data
      if (pageAccess && !validatePageAccess(pageAccess)) {
        console.warn('⚠️ Invalid page access data detected for user:', user.username);
      }
    }
  }, [user, isAuthenticated, pageAccess]);

  const value: AuthContextType = {
    user,
    token,
    // Global Variables
    username,
    role,
    ownerId,
    userId,
    email,
    fullName,
    pageAccess,
    // Page Access Methods
    hasPageAccess: checkPageAccess,
    hasPageAccessByPath: checkPageAccessByPath,
    getAccessiblePages: getUserAccessiblePages,
    canAccessDashboard,
    canAccessEvents,
    canAccessReports,
    canAccessSettings,
    // General Methods
    login,
    logout,
    refreshGlobalVariables,
    // State
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 