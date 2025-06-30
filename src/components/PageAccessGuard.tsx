import React, { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { PAGE_ACCESS_KEYS } from '../lib/globalVariables';

interface PageAccessGuardProps {
  children: ReactNode;
  requiredPageAccess?: string; // Page access key required (e.g., 'dashboard:true')
  fallbackPath?: string; // Where to redirect if no access (default: '/admin')
  showError?: boolean; // Whether to show error message instead of redirect
}

const PageAccessGuard: React.FC<PageAccessGuardProps> = ({ 
  children, 
  requiredPageAccess,
  fallbackPath = '/admin',
  showError = false
}) => {
  const { isAuthenticated, isLoading, hasPageAccess, user, pageAccess } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't check access while loading
    if (isLoading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      console.log('🔐 PageAccessGuard: User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }

    // If no specific page access required, allow access
    if (!requiredPageAccess) {
      console.log('🔐 PageAccessGuard: No specific page access required, allowing access');
      return;
    }

    // Check if user has the required page access
    const hasAccess = hasPageAccess(requiredPageAccess);
    
    console.log('🔐 PageAccessGuard: Checking access', {
      user: user?.username,
      role: user?.role,
      requiredAccess: requiredPageAccess,
      hasAccess: hasAccess,
      currentPath: router.pathname,
      userPageAccess: pageAccess
    });

    if (!hasAccess) {
      console.warn('❌ PageAccessGuard: Access denied', {
        user: user?.username,
        requiredAccess: requiredPageAccess,
        redirectTo: showError ? 'error page' : fallbackPath
      });

      if (!showError) {
        // Redirect to fallback path
        router.push(fallbackPath);
      }
    }
  }, [isAuthenticated, isLoading, requiredPageAccess, hasPageAccess, router, fallbackPath, showError, user, pageAccess]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Show login redirect state
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check page access and show error if needed
  if (requiredPageAccess && !hasPageAccess(requiredPageAccess)) {
    if (showError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-auto text-center p-8">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-full">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.633 0L4.182 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this page. Please contact your administrator if you believe this is an error.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Required Permission:</strong> {requiredPageAccess}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Your Role:</strong> {user?.role}
                </p>
              </div>
              <button
                onClick={() => router.push(fallbackPath)}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If not showing error and no access, show loading while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
};

// Helper function to get page access key for common pages
export const getPageAccessKey = (pagePath: string): string | undefined => {
  const pathMap: Record<string, string> = {
    '/admin': PAGE_ACCESS_KEYS.DASHBOARD,
    '/admin/visitors': PAGE_ACCESS_KEYS.VISITORS,
    '/admin/events': PAGE_ACCESS_KEYS.EVENTS,
    '/admin/badge-management': PAGE_ACCESS_KEYS.BADGE_MANAGEMENT,
    '/admin/forms': PAGE_ACCESS_KEYS.FORM_BUILDER,
    '/admin/messages': PAGE_ACCESS_KEYS.MESSAGES,
    '/admin/entry-log': PAGE_ACCESS_KEYS.ENTRY_LOG,
    '/admin/scanner': PAGE_ACCESS_KEYS.SCANNER,
    '/admin/reports': PAGE_ACCESS_KEYS.REPORTS,
    '/admin/settings': PAGE_ACCESS_KEYS.SETTINGS,
    '/admin/profile': PAGE_ACCESS_KEYS.PROFILE,
  };

  return pathMap[pagePath];
};

export default PageAccessGuard; 