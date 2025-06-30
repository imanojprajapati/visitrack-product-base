import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { hasPermission, isValidUserRole } from '../lib/rolePermissions';

interface AdminRouteGuardProps {
  children: React.ReactNode;
}

export default function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAccess = () => {
      // Wait for auth to load
      if (isLoading) return;

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Check if user has a valid role
      if (!user.role || !isValidUserRole(user.role)) {
        console.error('Invalid user role:', user.role);
        setIsAuthorized(false);
        return;
      }

      // Check route permissions
      const currentPath = router.pathname;
      if (!hasPermission(user.role, currentPath)) {
        setIsAuthorized(false);
        return;
      }

      setIsAuthorized(true);
    };

    checkAccess();
  }, [isAuthenticated, isLoading, user, router.pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F72AF] mx-auto mb-4"></div>
          <p className="text-[#112D4E]">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if user doesn't have permission
  if (!isAuthorized && isAuthenticated && user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F7F7]">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h1 className="text-2xl font-bold text-[#112D4E] mb-2">Access Denied</h1>
            <p className="text-[#3F72AF] mb-6">
              This page is not accessible for your role. You don't have permission to view this content.
            </p>
            
            <div className="bg-[#F9F7F7] rounded-lg p-4 mb-6">
              <p className="text-sm text-[#112D4E]">
                <strong>Your Role:</strong> {user.role}
              </p>
              <p className="text-sm text-[#3F72AF] mt-1">
                Contact your administrator for access to additional features.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push('/admin')}
                className="w-full bg-[#3F72AF] text-white px-4 py-2 rounded-lg hover:bg-[#112D4E] transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.back()}
                className="w-full bg-[#DBE2EF] text-[#112D4E] px-4 py-2 rounded-lg hover:bg-[#3F72AF] hover:text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
} 