import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';

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
  // Methods
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

  // Function to refresh global variables (useful for debugging)
  const refreshGlobalVariables = () => {
    console.log('🔄 Current Global Variables:', {
      userId: user?.id || null,
      ownerId: user?.ownerId || null,
      username: user?.username || null,
      role: user?.role || null,
      email: user?.email || null,
      fullName: user?.fullName || null,
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
        
        console.log('🔐 Restored user session - Global Variables loaded:', {
          userId: userData.id,
          ownerId: userData.ownerId,
          username: userData.username,
          role: userData.role,
          email: userData.email
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
        timestamp: new Date().toISOString()
      });
    }
  }, [user, isAuthenticated]);

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
    // Methods
    login,
    logout,
    refreshGlobalVariables,
    // State
    isAuthenticated,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 