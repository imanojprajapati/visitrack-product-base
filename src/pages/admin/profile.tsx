import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from '../../components/AdminLayout';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { User, Mail, Phone, Settings, Calendar } from 'lucide-react';

export default function Profile() {
  const { user, isAuthenticated, username, role, email, ownerId, userId } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    capacity: '',
    username: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Initialize profile data with user info
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email || email || '',
        phoneNumber: user.phoneNumber || '',
        capacity: user.capacity?.toString() || '',
        username: username || ''
      });
    }
  }, [isAuthenticated, user, email, username, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
        setEditMode(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (userRole: string) => {
    switch (userRole?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'staff':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <Head>
        <title>Profile - Visitrack</title>
        <meta name="description" content="Manage your profile settings and information" />
      </Head>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-1">Manage your account information and settings</p>
            </div>
            <Button
              onClick={() => setEditMode(!editMode)}
              variant={editMode ? "outline" : "default"}
            >
              <Settings className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          {/* Profile Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#3F72AF] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-2xl">{user?.fullName || 'User Name'}</CardTitle>
                  <CardDescription className="text-lg">@{username}</CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleBadgeColor(role || '')}>
                      {role?.toUpperCase() || 'USER'}
                    </Badge>
                    <Badge variant="outline">ID: {userId}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your personal information and account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={profileData.username}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center">
                      <Mail className="w-4 h-4 mr-1" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={profileData.email}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phoneNumber" className="flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={profileData.phoneNumber}
                      onChange={handleChange}
                      disabled={!editMode}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    value={profileData.capacity}
                    onChange={handleChange}
                    disabled={!editMode}
                    className="mt-1"
                  />
                </div>

                {editMode && (
                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Account Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Account Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">User ID</Label>
                  <p className="text-sm text-gray-900 mt-1">{userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Owner ID</Label>
                  <p className="text-sm text-gray-900 mt-1">{ownerId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Role</Label>
                  <p className="text-sm text-gray-900 mt-1 capitalize">{role}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Type</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {role === 'admin' ? 'Administrator' : role === 'manager' ? 'Manager' : 'Staff Member'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 