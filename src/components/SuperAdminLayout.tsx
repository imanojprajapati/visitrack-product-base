import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSuperAdmin } from '../context/SuperAdminContext';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

// Super Admin Navigation Items
const superAdminNavigation = [
  {
    name: 'Dashboard',
    path: '/superadmin',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z'
  },
  {
    name: 'All Users',
    path: '/superadmin/users',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
  },
  {
    name: 'Visitor Management',
    path: '/superadmin/visitors',
    icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
  },
  {
    name: 'Event Management',
    path: '/superadmin/events',
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
  },
  {
    name: 'Form Builder',
    path: '/superadmin/forms',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'Badge Management',
    path: '/superadmin/badges',
    icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
  },
  {
    name: 'Messages',
    path: '/superadmin/messages',
    icon: 'M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
  },
  {
    name: 'Reports',
    path: '/superadmin/reports',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  {
    name: 'Entry Logs',
    path: '/superadmin/entry-logs',
    icon: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
  },
  {
    name: 'Quick Scanner',
    path: '/superadmin/scanner',
    icon: 'M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4m-4 8h4m-4-4h.01M20 12h.01M4 12h.01M12 8h.01'
  },
  {
    name: 'Settings',
    path: '/superadmin/settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { superAdmin, logout } = useSuperAdmin();
  const router = useRouter();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#FFFCFB]">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-50 lg:relative lg:inset-auto lg:block lg:h-full lg:w-72`}>
        <div className="flex flex-col h-full bg-gradient-to-b from-[#093FB4] to-[#072B82] shadow-2xl">
          {/* Super Admin Header */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-[#072B82]">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3 bg-gradient-to-br from-[#FFFCFB] to-[#FFD8D8] shadow-lg">
                <svg className="w-6 h-6 text-[#093FB4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Super Admin</h1>
                <p className="text-xs text-[#FFFCFB] opacity-70">System Control</p>
              </div>
            </div>
            <button
              className="lg:hidden text-white hover:text-[#FFD8D8] transition-colors p-2 rounded-lg hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {superAdminNavigation.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${
                    isActive
                      ? 'bg-white text-[#093FB4] shadow-lg'
                      : 'text-white hover:bg-white/10 hover:text-[#FFD8D8]'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <svg 
                    className={`w-5 h-5 mr-3 transition-colors ${
                      isActive ? 'text-[#ED3500]' : 'text-current group-hover:text-[#FFD8D8]'
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                  </svg>
                  {item.name}
                  {isActive && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-[#ED3500]"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Signout */}
          <div className="px-4 py-6 border-t border-[#072B82] bg-gradient-to-r from-[#072B82] to-[#093FB4]">
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#FFFCFB] to-[#FFD8D8] shadow-lg">
                    <span className="font-bold text-lg text-[#093FB4]">
                      {superAdmin?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate text-white">
                    {superAdmin?.fullName || 'Admin'}
                  </p>
                  <p className="text-xs truncate text-[#FFFCFB] opacity-70">
                    {superAdmin?.email || superAdmin?.username}
                  </p>
                </div>
              </div>
              
              {/* Signout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 bg-gradient-to-r from-[#ED3500] to-[#D12B00] text-white hover:from-[#D12B00] hover:to-[#ED3500] shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="shadow-lg border-b-2 border-[#FFD8D8] bg-gradient-to-r from-[#FFFCFB] to-white">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              className="lg:hidden text-[#093FB4] hover:text-[#072B82] transition-colors p-2 rounded-lg hover:bg-[#FFD8D8]/30"
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-[#093FB4]">
                Super Admin Panel - {superAdmin?.fullName}
              </span>
              <div className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-[#093FB4] to-[#072B82] text-white shadow-md">
                <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Global Access
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#FFFCFB]">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#093FB4] bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 