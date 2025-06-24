import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';

export default function AdminDashboard() {
  const { isAuthenticated, isLoading, user, username, ownerId, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Visitrack</title>
        <meta name="description" content="Visitrack Admin Panel" />
      </Head>

      <AdminLayout>
        <div className="space-y-6 bg-[#F9F7F7] min-h-screen p-6">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#112D4E] mb-2">
              Welcome to Admin Panel
            </h1>
            <p className="text-[#3F72AF]">
              Hello, <span className="font-semibold text-[#112D4E]">{user?.fullName}</span>! 
              Welcome back to your Visitrack dashboard.
            </p>
          </div>

          {/* User Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DBE2EF]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#DBE2EF]">
                  <svg className="w-6 h-6 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#3F72AF]">Username</p>
                  <p className="text-lg font-semibold text-[#112D4E]">{username}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DBE2EF]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#DBE2EF]">
                  <svg className="w-6 h-6 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#3F72AF]">Role</p>
                  <p className="text-lg font-semibold text-[#112D4E] capitalize">{role}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DBE2EF]">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-[#DBE2EF]">
                  <svg className="w-6 h-6 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#3F72AF]">User ID</p>
                  <p className="text-lg font-semibold text-[#112D4E] font-mono">{ownerId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-[#112D4E] to-[#3F72AF] p-6 rounded-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#DBE2EF]">Total Events</p>
                  <p className="text-3xl font-bold">0</p>
                </div>
                <div className="p-3 bg-white bg-opacity-20 rounded-full">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#DBE2EF] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3F72AF]">Active Events</p>
                  <p className="text-3xl font-bold text-[#112D4E]">0</p>
                </div>
                <div className="p-3 bg-[#DBE2EF] rounded-full">
                  <svg className="w-8 h-8 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#DBE2EF] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3F72AF]">Total Attendees</p>
                  <p className="text-3xl font-bold text-[#112D4E]">0</p>
                </div>
                <div className="p-3 bg-[#DBE2EF] rounded-full">
                  <svg className="w-8 h-8 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-[#DBE2EF] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3F72AF]">Check-ins Today</p>
                  <p className="text-3xl font-bold text-[#112D4E]">0</p>
                </div>
                <div className="p-3 bg-[#DBE2EF] rounded-full">
                  <svg className="w-8 h-8 text-[#3F72AF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="bg-white rounded-lg shadow-sm border border-[#DBE2EF] p-6">
            <h2 className="text-xl font-semibold text-[#112D4E] mb-4">Getting Started</h2>
            <div className="prose max-w-none">
              <p className="text-[#3F72AF] mb-4">
                Welcome to your Visitrack admin dashboard! Here you can manage your events, 
                track attendees, and monitor real-time check-ins. 
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#3F72AF] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#112D4E]">Create Your First Event</h3>
                    <p className="text-sm text-[#3F72AF]">Set up your event details and start managing registrations.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#3F72AF] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#112D4E]">Invite Attendees</h3>
                    <p className="text-sm text-[#3F72AF]">Send invitations and manage your attendee list.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#3F72AF] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#112D4E]">Monitor Check-ins</h3>
                    <p className="text-sm text-[#3F72AF]">Track real-time attendance and manage on-site check-ins.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-[#3F72AF] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">4</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Generate Reports</h3>
                    <p className="text-sm text-gray-500">Access detailed analytics and export attendance data.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </>
  );
} 