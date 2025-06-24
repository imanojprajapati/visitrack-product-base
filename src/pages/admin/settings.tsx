import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardHeader, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useToast } from '../../hooks/use-toast';
import { Users, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface User {
  _id: string;
  ownerId: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  capacity: number;
  username: string;
  role: 'admin' | 'sub-admin' | 'manager' | 'staff';
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export default function Settings() {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    username: '',
    password: '',
    role: 'staff' as 'sub-admin' | 'manager' | 'staff'
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    if (!token) return;

    try {
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch users",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      phoneNumber: '',
      email: '',
      username: '',
      password: '',
      role: 'staff'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User created successfully",
        });
        resetForm();
        setIsCreateModalOpen(false);
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to create user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        fetchUsers();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      username: user.username,
      password: '', // Keep password empty for edit
      role: user.role as 'sub-admin' | 'manager' | 'staff'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !editingUser) return;

    setIsEditing(true);
    try {
      // Prepare update data (exclude password if empty)
      const updateData = {
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        username: formData.username,
        role: formData.role,
        ...(formData.password && { password: formData.password }) // Only include password if provided
      };

      const response = await fetch(`/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        resetForm();
        setIsEditModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'sub-admin':
        return 'bg-[#3F72AF] text-white';
      case 'manager':
        return 'bg-[#112D4E] text-white';
      case 'staff':
        return 'bg-[#DBE2EF] text-[#3F72AF]';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#3F72AF]"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="space-y-6 bg-[#F9F7F7] min-h-screen p-6">
          <Card className="p-8 text-center bg-white border-[#DBE2EF]">
            <h3 className="text-lg font-medium text-[#112D4E] mb-2">Access Denied</h3>
            <p className="text-[#3F72AF]">Only administrators can access user management.</p>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - User Management | Visitrack</title>
        <meta name="description" content="Manage users and system settings" />
      </Head>

      <AdminLayout>
        <div className="space-y-6 bg-[#F9F7F7] min-h-screen p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#112D4E]">Settings</h1>
              <p className="text-[#3F72AF]">Manage users and system configuration</p>
            </div>
          </div>

          {/* User Management Section */}
          <Card className="bg-white border-[#DBE2EF]">
            <CardHeader className="border-b border-[#DBE2EF]">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-[#112D4E] flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#3F72AF]" />
                    User Management
                  </h2>
                  <p className="text-[#3F72AF] text-sm">Manage staff members and user accounts</p>
                </div>
                
                <Dialog open={isCreateModalOpen} onOpenChange={(open) => {
                  setIsCreateModalOpen(open);
                  if (open) {
                    resetForm(); // Reset form when opening modal
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3F72AF] hover:bg-[#112D4E] text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-white border-[#DBE2EF]">
                    <DialogHeader>
                      <DialogTitle className="text-[#112D4E]">Create New User</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName" className="text-[#112D4E]">Full Name *</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF]"
                            autoComplete="off"
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="phoneNumber" className="text-[#112D4E]">Phone Number *</Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF]"
                            autoComplete="off"
                            placeholder="Enter phone number"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-[#112D4E]">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="border-[#DBE2EF] focus:border-[#3F72AF]"
                          autoComplete="off"
                          placeholder="Enter email address"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="username" className="text-[#112D4E]">Username *</Label>
                        <Input
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="border-[#DBE2EF] focus:border-[#3F72AF]"
                          autoComplete="off"
                          placeholder="Enter username"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="password" className="text-[#112D4E]">Password *</Label>
                        <div className="relative">
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF] pr-10"
                            autoComplete="new-password"
                            placeholder="Enter password"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3F72AF] hover:text-[#112D4E]"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="role" className="text-[#112D4E]">Role *</Label>
                        <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                          <SelectTrigger className="border-[#DBE2EF] focus:border-[#3F72AF]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsCreateModalOpen(false)}
                          className="border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF]"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isCreating}
                          className="bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                        >
                          {isCreating ? 'Creating...' : 'Create User'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit User Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={(open) => {
                  setIsEditModalOpen(open);
                  if (!open) {
                    setEditingUser(null);
                    resetForm();
                  }
                }}>
                  <DialogContent className="sm:max-w-[500px] bg-white border-[#DBE2EF]">
                    <DialogHeader className="border-b border-[#DBE2EF] pb-4">
                      <DialogTitle className="text-xl font-semibold text-[#112D4E]">
                        Edit User
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="edit-fullName" className="text-[#112D4E]">Full Name *</Label>
                          <Input
                            id="edit-fullName"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF]"
                            autoComplete="off"
                            placeholder="Enter full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="edit-phoneNumber" className="text-[#112D4E]">Phone Number *</Label>
                          <Input
                            id="edit-phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF]"
                            autoComplete="off"
                            placeholder="Enter phone number"
                            required
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-email" className="text-[#112D4E]">Email *</Label>
                        <Input
                          id="edit-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="border-[#DBE2EF] focus:border-[#3F72AF]"
                          autoComplete="off"
                          placeholder="Enter email address"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-username" className="text-[#112D4E]">Username *</Label>
                        <Input
                          id="edit-username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="border-[#DBE2EF] focus:border-[#3F72AF]"
                          autoComplete="off"
                          placeholder="Enter username"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-password" className="text-[#112D4E]">Password</Label>
                        <div className="relative">
                          <Input
                            id="edit-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            className="border-[#DBE2EF] focus:border-[#3F72AF] pr-10"
                            autoComplete="new-password"
                            placeholder="Leave empty to keep current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#3F72AF] hover:text-[#112D4E]"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#3F72AF] mt-1">Leave empty to keep current password</p>
                      </div>

                      <div>
                        <Label htmlFor="edit-role" className="text-[#112D4E]">Role *</Label>
                        <Select value={formData.role} onValueChange={(value) => handleSelectChange('role', value)}>
                          <SelectTrigger className="border-[#DBE2EF] focus:border-[#3F72AF]">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="sub-admin">Sub-Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setIsEditModalOpen(false)}
                          className="border-[#DBE2EF] text-[#3F72AF] hover:bg-[#DBE2EF]"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isEditing}
                          className="bg-[#3F72AF] hover:bg-[#112D4E] text-white"
                        >
                          {isEditing ? 'Updating...' : 'Update User'}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3F72AF] mx-auto"></div>
                  <p className="text-[#3F72AF] mt-2">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-[#DBE2EF] mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-[#112D4E] mb-2">No users found</h3>
                  <p className="text-[#3F72AF] mb-4">Start by creating your first user</p>
                  <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#3F72AF] hover:bg-[#112D4E] text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user._id} className="border border-[#DBE2EF] rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#112D4E]">{user.fullName}</h3>
                                                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleStyle(user.role)}`}>
                                {user.role === 'sub-admin' ? 'Sub-Admin' : 
                                 user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-[#112D4E]">Username:</span>
                              <p className="text-[#3F72AF]">@{user.username}</p>
                            </div>
                            <div>
                              <span className="font-medium text-[#112D4E]">Email:</span>
                              <p className="text-[#3F72AF]">{user.email}</p>
                            </div>
                            <div>
                              <span className="font-medium text-[#112D4E]">Phone:</span>
                              <p className="text-[#3F72AF]">{user.phoneNumber}</p>
                            </div>
                            <div>
                              <span className="font-medium text-[#112D4E]">Created:</span>
                              <p className="text-[#3F72AF]">{formatDate(user.createdAt)}</p>
                            </div>
                            <div>
                              <span className="font-medium text-[#112D4E]">Last Login:</span>
                              <p className="text-[#3F72AF]">
                                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-[#112D4E]">Capacity:</span>
                              <p className="text-[#3F72AF]">{user.capacity.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {/* Only show edit and delete buttons for non-admin users */}
                          {user.role !== 'admin' ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="text-[#3F72AF] hover:text-[#112D4E] hover:bg-[#DBE2EF]"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user._id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-[#3F72AF]">
                              <span className="px-2 py-1 bg-[#DBE2EF] rounded text-xs">
                                Protected User
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </>
  );
} 