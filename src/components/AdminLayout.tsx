import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { getAccessibleRoutes } from '../lib/rolePermissions';
import AdminRouteGuard from './AdminRouteGuard';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, username, ownerId, logout } = useAuth();
  const router = useRouter();

  // Get navigation items based on user role
  const navigation = user?.role ? getAccessibleRoutes(user.role) : [];

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
              {navigation.map((item) => {
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
              })}
            </nav>

            {/* User Info at Bottom */}
            <div className="px-4 py-4 border-t border-[#DBE2EF] bg-white">
              <div 
                className="flex items-center space-x-3 mb-4 cursor-pointer hover:bg-[#F9F7F7] rounded-lg p-2 transition-colors"
                onClick={() => router.push('/admin/profile')}
                title="Click to view profile"
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
              
              {/* User Details */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#3F72AF]">Role:</span>
                  <span className="text-xs font-medium text-[#112D4E] capitalize">{user?.role}</span>
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