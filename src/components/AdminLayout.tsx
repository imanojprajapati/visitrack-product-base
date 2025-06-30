import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { adminRoutes } from '../lib/rolePermissions';
import { PAGE_ACCESS_KEYS } from '../lib/globalVariables';
import AdminRouteGuard from './AdminRouteGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, username, ownerId, logout, hasPageAccess, pageAccess } = useAuth();
  const router = useRouter();

  // Map page paths to page access keys
  const getPageAccessKey = (path: string): string | undefined => {
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
    return pathMap[path];
  };

  // Filter navigation items based on user's role and page access permissions
  const navigation = adminRoutes.filter(route => {
    // First check role-based permissions
    const userRole = user?.role?.toLowerCase();
    if (!route.allowedRoles.includes(userRole as any)) {
      return false;
    }

    // Then check page access permissions
    const pageAccessKey = getPageAccessKey(route.path);
    if (!pageAccessKey) {
      console.warn(`⚠️ No page access key found for route: ${route.path}`);
      return false;
    }
    
    const hasAccess = hasPageAccess(pageAccessKey);
    
    console.log(`🔐 Navigation Filter: ${route.name} (Role: ${userRole}, Access: ${hasAccess})`);
    return hasAccess;
  });

  const handleLogout = () => {
    logout();
  };

  return (
    <AdminRouteGuard>
      <div className="h-screen flex overflow-hidden bg-[#F9F7F7]">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-50 lg:relative lg:inset-auto lg:block lg:h-full lg:w-64 bg-white shadow-lg border-r border-[#DBE2EF]`}>
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center justify-between h-16 px-6 bg-[#112D4E]">
              <div className="flex items-center">
                <span className="text-white text-xl font-bold">Visitrack</span>
              </div>
              <button
                className="lg:hidden text-white hover:text-[#DBE2EF]"
                onClick={() => setSidebarOpen(false)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 bg-white">
              {navigation.length > 0 ? (
                navigation.map((item) => {
                  const isActive = router.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-[#3F72AF] text-white shadow-sm'
                          : 'text-[#112D4E] hover:bg-[#DBE2EF] hover:text-[#112D4E]'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                      </svg>
                      {item.name}
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-[#3F72AF] mb-2">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm text-[#3F72AF]">No accessible pages</p>
                  <p className="text-xs text-gray-500 mt-1">Contact your administrator</p>
                </div>
              )}
            </nav>

            {/* User Info at Bottom */}
            <div className="px-4 py-4 border-t border-[#DBE2EF] bg-white">
              <div 
                className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-[#F9F7F7] rounded-lg p-2 transition-colors"
                onClick={() => {
                  // Only navigate to profile if user has access
                  if (hasPageAccess(PAGE_ACCESS_KEYS.PROFILE)) {
                    router.push('/admin/profile');
                  } else {
                    console.warn('❌ No access to profile page');
                  }
                }}
                title={hasPageAccess(PAGE_ACCESS_KEYS.PROFILE) ? "Click to view profile" : "No access to profile"}
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#3F72AF] rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#112D4E] truncate">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-[#3F72AF] truncate">
                    @{username}
                  </p>
                </div>
              </div>
              
              {/* Role-Based Access Information */}
              <div className="space-y-3 mb-4">
                {/* Role Badge */}
                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                    user?.role === 'admin' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' :
                    user?.role === 'sub-admin' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' :
                    user?.role === 'manager' ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' :
                    user?.role === 'staff' ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white' :
                    'bg-gray-600 text-white'
                  }`}>
                    {user?.role?.replace('-', ' ')}
                  </span>
                </div>
                
                {/* Access Level Indicator */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#3F72AF] uppercase tracking-wide">Page Access</span>
                    <span className="text-xs font-bold text-[#112D4E]">
                      {navigation.length}/{adminRoutes.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#3F72AF] to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(navigation.length / adminRoutes.length) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {user?.role === 'admin' || user?.role === 'sub-admin' ? '✓ Full System Access' :
                     user?.role === 'manager' ? '✓ Management Access' :
                     user?.role === 'staff' ? '✓ Essential Features' :
                     'Limited Access'}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-[#112D4E] bg-[#F9F7F7] border border-[#DBE2EF] rounded-lg hover:bg-[#DBE2EF] transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="bg-white shadow-sm border-b border-[#DBE2EF]">
            <div className="flex items-center justify-between h-16 px-6">
              <button
                className="lg:hidden text-[#3F72AF] hover:text-[#112D4E]"
                onClick={() => setSidebarOpen(true)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-[#3F72AF]">
                  Welcome back, <span className="font-medium text-[#112D4E]">{user?.fullName}</span>
                </span>
                <span className="text-xs bg-[#3F72AF] text-white px-2 py-1 rounded-full">
                  {user?.role}
                </span>
                {pageAccess && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {Object.keys(pageAccess).filter(key => pageAccess[key]).length} pages
                  </span>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-[#F9F7F7]">
            {children}
          </main>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </AdminRouteGuard>
  );
} 