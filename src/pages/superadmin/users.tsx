import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SuperAdminLayout from '../../components/SuperAdminLayout';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Search, Users, Calendar, Mail, Building, Globe, Shield, Settings, Edit, Eye, EyeOff, Save, X } from 'lucide-react';

interface User {
  id: string;
  _id: string;
  ownerId: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  phoneNumber?: string;
  capacity?: number;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  // Page access permissions
  'dashboard:true'?: boolean;
  'visitors:true'?: boolean;
  'events:true'?: boolean;
  'badge-management:true'?: boolean;
  'form-builder:true'?: boolean;
  'messages:true'?: boolean;
  'entry-log:true'?: boolean;
  'scanner:true'?: boolean;
  'reports:true'?: boolean;
  'setting:true'?: boolean;
  'profile:true'?: boolean;
}

interface PageAccessEditorProps {
  user: User;
  onSave: (userId: string, pageAccess: Record<string, boolean>) => Promise<void>;
}

const PageAccessEditor = ({ user, onSave }: PageAccessEditorProps) => {
  const [pageAccess, setPageAccess] = useState({
    'dashboard:true': user['dashboard:true'] ?? true,
    'visitors:true': user['visitors:true'] ?? true,
    'events:true': user['events:true'] ?? true,
    'badge-management:true': user['badge-management:true'] ?? true,
    'form-builder:true': user['form-builder:true'] ?? true,
    'messages:true': user['messages:true'] ?? true,
    'entry-log:true': user['entry-log:true'] ?? true,
    'scanner:true': user['scanner:true'] ?? true,
    'reports:true': user['reports:true'] ?? true,
    'setting:true': user['setting:true'] ?? true,
    'profile:true': user['profile:true'] ?? true,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const pageLabels = {
    'dashboard:true': 'Dashboard',
    'visitors:true': 'Visitors',
    'events:true': 'Events',
    'badge-management:true': 'Badge Management',
    'form-builder:true': 'Form Builder',
    'messages:true': 'Messages',
    'entry-log:true': 'Entry Log',
    'scanner:true': 'Scanner',
    'reports:true': 'Reports',
    'setting:true': 'Settings',
    'profile:true': 'Profile',
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(user.id, pageAccess);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving page access:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-[#093FB4] hover:bg-[#072B82] text-white border-none shadow-md"
        >
          <Edit className="h-4 w-4 mr-1" />
          Edit Access
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl bg-[#FFFCFB] border-2 border-[#FFD8D8] shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#093FB4] flex items-center">
            <Shield className="h-5 w-5 mr-2 text-[#ED3500]" />
            Edit Page Access - {user.fullName}
          </DialogTitle>
          <p className="text-[#093FB4] text-sm opacity-75">
            Owner ID: {user.ownerId} | Username: @{user.username}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <div className="bg-[#ED3500] text-white p-3 rounded-lg text-sm">
            <strong>⚠️ Important:</strong> If you disable Dashboard access, it will be disabled for ALL users with the same Owner ID ({user.ownerId}).
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(pageLabels).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-[#FFD8D8] shadow-sm">
                <label className="text-[#093FB4] font-medium">{label}</label>
                <button
                  onClick={() => setPageAccess(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all shadow-md ${
                    pageAccess[key as keyof typeof pageAccess]
                      ? 'bg-[#093FB4] text-white hover:bg-[#072B82]'
                      : 'bg-[#ED3500] text-white hover:bg-[#D12B00]'
                  }`}
                >
                  {pageAccess[key as keyof typeof pageAccess] ? (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3 mr-1" />
                      Disabled
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-[#FFD8D8] text-[#093FB4] hover:bg-[#FFD8D8] hover:text-[#093FB4]"
          >
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function SuperAdminUsers() {
  const router = useRouter();
  const { superAdmin, isAuthenticated, isLoading } = useSuperAdmin();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersByOrg, setUsersByOrg] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/superadmin/login');
      return;
    }
    
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, isLoading]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalUsers(data.pagination?.totalUsers || 0);
      setUsersByOrg(data.usersByOrg || []);
    } catch (err) {
      setError('Failed to load admin users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePageAccess = async (userId: string, pageAccess: Record<string, boolean>) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      
      const response = await fetch('/api/superadmin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, pageAccess })
      });

      if (!response.ok) {
        throw new Error('Failed to update page access');
      }

      const data = await response.json();
      
      toast({
        title: "Page Access Updated",
        description: data.cascadeApplied 
          ? `Page access updated successfully. Dashboard access was disabled for all users with Owner ID: ${data.affectedOwnerId}`
          : "Page access updated successfully",
      });

      // Refresh the users list
      await fetchUsers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update page access. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? '#093FB4' : '#ED3500';
  };

  const filteredUsers = users.filter(user => 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.ownerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#FFFCFB]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093FB4]"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6 bg-[#FFFCFB] min-h-screen p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#093FB4]">Admin User Management</h1>
                <p className="mt-1 text-[#093FB4] opacity-70">Manage all admin users across organizations</p>
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="px-6 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] shadow-lg">
              Admin Users Only • {totalUsers.toLocaleString()} Total
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Total Admin Users</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{totalUsers.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#D12B00] shadow-md">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Organizations</p>
                  <p className="text-2xl font-bold text-[#093FB4]">{usersByOrg.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#093FB4] to-[#ED3500] shadow-md">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Active Users</p>
                  <p className="text-2xl font-bold text-[#093FB4]">
                    {users.filter(u => u.isActive).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[#ED3500] to-[#093FB4] shadow-md">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[#093FB4] opacity-70">Global Access</p>
                  <p className="text-2xl font-bold text-[#093FB4]">∞</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#093FB4] opacity-50" />
              <Input
                placeholder="Search admin users by name, email, username, or owner ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-[#FFD8D8] focus:border-[#093FB4] bg-[#FFFCFB] rounded-lg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-2 border-[#FFD8D8] bg-white shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="text-white bg-gradient-to-r from-[#093FB4] to-[#072B82] border-b-0">
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2" />
              Admin User Directory ({filteredUsers.length} users)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#093FB4]"></div>
                <span className="ml-3 text-[#093FB4]">Loading admin users...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-[#ED3500]">{error}</p>
                <Button 
                  onClick={fetchUsers}
                  className="mt-4 bg-[#ED3500] hover:bg-[#D12B00] text-white border-none shadow-md"
                >
                  Retry
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y-2 divide-[#FFD8D8]">
                  <thead className="bg-[#FFFCFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Admin User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Page Access
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#093FB4] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#FFD8D8]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FFFCFB] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-medium bg-gradient-to-br from-[#093FB4] to-[#072B82] shadow-md">
                              {user.fullName?.charAt(0)?.toUpperCase() || 'A'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-[#093FB4]">{user.fullName || 'No Name'}</div>
                              <div className="text-sm text-[#093FB4] opacity-70">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-[#093FB4] opacity-70">
                            <Mail className="h-4 w-4 mr-2 text-[#ED3500]" />
                            {user.email}
                          </div>
                          {user.phoneNumber && (
                            <div className="text-sm text-[#093FB4] opacity-70 mt-1">
                              📞 {user.phoneNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-[#093FB4]">Owner ID</div>
                            <div className="text-[#093FB4] opacity-70 font-mono text-xs">{user.ownerId}</div>
                            {user.capacity && (
                              <div className="text-[#093FB4] opacity-70 text-xs mt-1">
                                Capacity: {user.capacity.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                              style={{ backgroundColor: getStatusColor(user.isActive) }}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div className="text-xs text-[#093FB4] opacity-70">
                              Email: {user.emailVerified ? '✅ Verified' : '❌ Unverified'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-1 text-xs">
                            {Object.entries({
                              'Dashboard': user['dashboard:true'],
                              'Visitors': user['visitors:true'],
                              'Events': user['events:true'],
                              'Badges': user['badge-management:true'],
                              'Forms': user['form-builder:true'],
                              'Messages': user['messages:true'],
                              'Entry Log': user['entry-log:true'],
                              'Scanner': user['scanner:true'],
                              'Reports': user['reports:true'],
                              'Settings': user['setting:true'],
                              'Profile': user['profile:true'],
                            }).slice(0, 6).map(([key, value]) => (
                              <span 
                                key={key}
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  value ? 'bg-[#093FB4] text-white' : 'bg-[#ED3500] text-white'
                                } shadow-sm`}
                              >
                                {key}: {value ? '✓' : '✗'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <PageAccessEditor 
                            user={user} 
                            onSave={handleUpdatePageAccess}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
