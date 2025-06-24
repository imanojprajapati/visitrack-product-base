'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { Event } from '@/types/event';

interface Badge {
  _id?: string;
  ownerId: string;
  badgeName: string;
  badgeImage: string;
  eventName: string;
  eventId: string;
  createdBy: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BadgeManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeToDelete, setBadgeToDelete] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    badgeName: '',
    eventId: '',
  });

  // Fetch badges and events
  const fetchData = async () => {
    if (!user?.id) {
      console.log('No user found, skipping data fetch');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('No auth token found');
      toast({
        title: "Authentication Error",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      console.log('Fetching data for user:', {
        userId: user.id,
        ownerId: user.ownerId,
        username: user.username
      });
      
      // Fetch badges
      const badgesResponse = await fetch('/api/badges', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!badgesResponse.ok) {
        if (badgesResponse.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await badgesResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch badges');
      }

      const badgesData = await badgesResponse.json();
      setBadges(badgesData);
      console.log(`Fetched ${badgesData.length} badges`);

      // Fetch events
      const eventsResponse = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!eventsResponse.ok) {
        if (eventsResponse.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        const errorData = await eventsResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch events');
      }

      const eventsData = await eventsResponse.json();
      setEvents(eventsData);
      console.log(`Fetched ${eventsData.length} events`);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log('User not authenticated, redirecting to login');
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchData();
    }
  }, [user?.id, isAuthenticated]);

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPEG, PNG, GIF, or WebP).",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setImageFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle create badge
  const handleCreateBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.badgeName.trim()) {
      toast({
        title: "Validation Error",
        description: "Badge name is required.",
        variant: "destructive"
      });
      return;
    }

    if (!createForm.eventId) {
      toast({
        title: "Validation Error",
        description: "Please select an event.",
        variant: "destructive"
      });
      return;
    }

    if (!imageFile) {
      toast({
        title: "Validation Error",
        description: "Please select a badge image.",
        variant: "destructive"
      });
      return;
    }

    setCreating(true);

    try {
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', imageFile);

      const uploadResponse = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadData = await uploadResponse.json();

      // Create badge
      const response = await fetch('/api/badges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({
          badgeName: createForm.badgeName.trim(),
          eventId: createForm.eventId,
          badgeImage: uploadData.url,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create badge');
      }

      toast({
        title: "Success!",
        description: "Badge created successfully.",
      });

      // Reset form and close modal
      setCreateForm({ badgeName: '', eventId: '' });
      setImageFile(null);
      setImagePreview(null);
      setCreateModalOpen(false);
      
      // Refresh badges list
      fetchData();
    } catch (error: any) {
      console.error('Error creating badge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create badge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle delete badge confirmation
  const handleDeleteClick = (badgeId: string) => {
    setBadgeToDelete(badgeId);
    setDeleteConfirmOpen(true);
  };

  // Handle delete badge
  const handleDeleteBadge = async () => {
    if (!badgeToDelete) return;

    try {
      const response = await fetch(`/api/badges?id=${badgeToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete badge');
      }

      toast({
        title: "Success!",
        description: "Badge deleted successfully.",
      });

      // Refresh badges list
      fetchData();
    } catch (error: any) {
      console.error('Error deleting badge:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete badge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setBadgeToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Get event name by ID
  const getEventName = (eventId: string) => {
    const event = events.find(e => e._id === eventId);
    return event?.eventName || 'Unknown Event';
  };

  // Reset create modal when opening
  const handleCreateModalOpen = (open: boolean) => {
    if (open) {
      setCreateForm({ badgeName: '', eventId: '' });
      setImageFile(null);
      setImagePreview(null);
    }
    setCreateModalOpen(open);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Checking authentication...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Redirecting to login...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading badges...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Badge Management - Visitrack Admin</title>
          <meta name="description" content="Manage event badges" />
        </Head>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Badge Management</h1>
                <p className="mt-2 text-gray-600">Create and manage event badges</p>
              </div>
              
              <Dialog open={createModalOpen} onOpenChange={handleCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Badge
                  </Button>
                </DialogTrigger>
                
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Badge</DialogTitle>
                    <DialogDescription>
                      Add a new badge for your events.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleCreateBadge} className="space-y-4">
                    <div>
                      <Label htmlFor="badgeName">Badge Name</Label>
                      <Input
                        id="badgeName"
                        type="text"
                        value={createForm.badgeName}
                        onChange={(e) => setCreateForm({ ...createForm, badgeName: e.target.value })}
                        placeholder="Enter badge name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="eventId">Select Event</Label>
                      <Select value={createForm.eventId} onValueChange={(value) => setCreateForm({ ...createForm, eventId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event._id} value={event._id!}>
                              {event.eventName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="badgeImage">Badge Image</Label>
                      <Input
                        id="badgeImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                      </p>
                    </div>

                    {imagePreview && (
                      <div className="mt-4">
                        <Label>Preview</Label>
                        <div className="mt-2 relative w-32 h-32 border rounded-lg overflow-hidden">
                          <Image
                            src={imagePreview}
                            alt="Badge preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" disabled={creating} className="flex-1">
                        {creating ? 'Creating...' : 'Create Badge'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setCreateModalOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{badges.length}</div>
                <p className="text-xs text-muted-foreground">Active badges</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Events</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">Events for badges</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Badges</CardTitle>
                <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {badges.filter(badge => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(badge.createdAt) > weekAgo;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Created this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Badges Grid */}
          {badges.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No badges</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating your first badge.</p>
              <div className="mt-6">
                <Button onClick={() => setCreateModalOpen(true)}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Badge
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {badges.map((badge) => (
                <Card key={badge._id} className="hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-48 w-full">
                    <Image
                      src={badge.badgeImage}
                      alt={badge.badgeName}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg truncate">{badge.badgeName}</CardTitle>
                    <CardDescription className="text-sm">
                      {getEventName(badge.eventId)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex flex-col space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Created: {new Date(badge.createdAt).toLocaleDateString()}
                      </div>
                      
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        By: {badge.createdBy.username}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedBadge(badge);
                          setDetailModalOpen(true);
                        }}
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(badge._id!)}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Badge Detail Modal */}
          <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Badge Details</DialogTitle>
              </DialogHeader>
              
              {selectedBadge && (
                <div className="space-y-4">
                  <div className="relative h-64 w-full rounded-lg overflow-hidden">
                    <Image
                      src={selectedBadge.badgeImage}
                      alt={selectedBadge.badgeName}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Badge Name</Label>
                      <p className="text-sm text-gray-900">{selectedBadge.badgeName}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Event</Label>
                      <p className="text-sm text-gray-900">{getEventName(selectedBadge.eventId)}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created By</Label>
                      <p className="text-sm text-gray-900">
                        {selectedBadge.createdBy.username} ({selectedBadge.createdBy.email})
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedBadge.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setDetailModalOpen(false)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleDeleteClick(selectedBadge._id!);
                      }}
                      className="flex-1"
                    >
                      Delete Badge
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            open={deleteConfirmOpen}
            onOpenChange={setDeleteConfirmOpen}
            title="Delete Badge"
            description="Are you sure you want to delete this badge? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={handleDeleteBadge}
            variant="destructive"
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default BadgeManagement; 