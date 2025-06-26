'use client';

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useDebounceSearch } from '@/hooks/use-debounced-search';
import AdminLayout from '@/components/AdminLayout';
import { Visitor } from '@/types/visitor';
import { Event } from '@/types/event';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Users, Calendar, Filter, ChevronLeft, ChevronRight, Eye, Mail, Phone, MapPin, QrCode, Download } from 'lucide-react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface PaginationInfo {
  current: number;
  total: number;
  count: number;
  limit: number;
}

// Pagination settings
const ITEMS_PER_PAGE = 50;

const VisitorManagement = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current: 1,
    total: 1,
    count: 0,
    limit: ITEMS_PER_PAGE
  });

  // Filter states (excluding search which is now debounced)
  const [filters, setFilters] = useState({
    eventId: 'all',
    status: 'all'
  });

  // Debounced search
  const searchHook = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      if (isAuthenticated && user?.id) {
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchVisitors(1, searchTerm);
      }
    }, [isAuthenticated, user?.id, filters])
  });

  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchEvents();
      fetchVisitors(1, searchHook.debouncedSearchTerm);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch events for the filter dropdown
  const fetchEvents = async () => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch visitors
  const fetchVisitors = async (page: number = 1, searchTerm: string = '') => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      });

      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      
      if (filters.eventId && filters.eventId !== 'all') {
        params.append('eventId', filters.eventId);
      }
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await fetch(`/api/visitors?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('authToken');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch visitors');
      }

      const data = await response.json();
      setVisitors(data.visitors);
      setPagination(data.pagination);
      
      console.log(`📊 [Visitors] Fetched ${data.visitors.length} visitors (page ${data.pagination.current}/${data.pagination.total})`);
    } catch (error: any) {
      console.error('Error fetching visitors:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load visitors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
    // Immediately fetch with new filter
    fetchVisitors(1, searchHook.debouncedSearchTerm);
  };

  // Watch for filter changes and refetch data
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setPagination(prev => ({ ...prev, current: 1 }));
      fetchVisitors(1, searchHook.debouncedSearchTerm);
    }
  }, [filters.eventId, filters.status]);

  // Handle view visitor details
  const handleViewVisitor = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setViewModalOpen(true);
  };

  // Handle QR code generation
  const handleQRCode = async (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setGeneratingQR(true);
    setQrModalOpen(true);
    
    try {
      const visitorId = visitor._id || '';
      const qrData = generateQRData(visitorId);
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingQR(false);
    }
  };

  // Generate QR code data
  const generateQRData = (visitorId: string) => {
    return visitorId;
  };

  // Download QR code
  const downloadQRCode = () => {
    if (!qrCodeUrl || !selectedVisitor) return;
    
    const visitorId = selectedVisitor._id || '';
    const link = document.createElement('a');
    link.download = `qr-code-${selectedVisitor.fullName.replace(/\s+/g, '-').toLowerCase()}-${visitorId}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Success!",
      description: "QR code downloaded successfully.",
    });
  };

  // Get event name by ID
  const getEventName = (eventId: string) => {
    const event = events.find(e => e._id === eventId);
    return event?.eventName || 'Unknown Event';
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registration':
        return 'bg-orange-100 text-orange-800';
      case 'visited':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total) {
      setPagination(prev => ({ ...prev, current: newPage }));
      fetchVisitors(newPage, searchHook.debouncedSearchTerm);
    }
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
            <p className="text-gray-500">Loading visitors...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>Visitor Management - Visitrack Admin</title>
          <meta name="description" content="Manage event visitors" />
        </Head>

        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Visitor Management</h1>
                <p className="mt-2 text-gray-600">View and manage event visitors</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registered</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pagination.count}</div>
                <p className="text-xs text-muted-foreground">Registered visitors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{events.length}</div>
                <p className="text-xs text-muted-foreground">Active events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visited</CardTitle>
                <Eye className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {visitors.filter(v => v.status.toLowerCase() === 'visited').length}
                </div>
                <p className="text-xs text-muted-foreground">Completed visits</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {visitors.filter(v => {
                    const today = new Date().toISOString().split('T')[0];
                    return v.visitorRegistrationDate === today;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Registered today</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search Visitors</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, email, phone..."
                      value={searchHook.searchTerm}
                      onChange={(e) => searchHook.updateSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {searchHook.isSearching && (
                      <div className="absolute right-3 top-3 h-4 w-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventFilter">Filter by Event</Label>
                  <Select value={filters.eventId} onValueChange={(value) => handleFilterChange('eventId', value)}>
                    <SelectTrigger id="eventFilter">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      {events.map((event) => (
                        <SelectItem key={event._id} value={event._id!}>
                          {event.eventName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="statusFilter">Filter by Status</Label>
                  <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                    <SelectTrigger id="statusFilter">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Registration">Registration</SelectItem>
                      <SelectItem value="Visited">Visited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


              </div>
            </CardContent>
          </Card>

          {/* Visitors List */}
          {visitors.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No visitors found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchHook.searchTerm || filters.eventId !== 'all' || filters.status !== 'all'
                      ? "Try adjusting your search or filter criteria."
                      : "Visitors will appear here when they register for your events."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Visitors ({pagination.count})</CardTitle>
                <CardDescription>
                  Showing {((pagination.current - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(pagination.current * ITEMS_PER_PAGE, pagination.count)} of {pagination.count} visitors
                  {pagination.total > 1 && ` (Page ${pagination.current} of ${pagination.total})`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {visitors.map((visitor) => (
                    <div key={visitor._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{visitor.fullName}</h3>
                              <p className="text-sm text-gray-600">{getEventName(visitor.eventId)}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                              {visitor.status}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 mr-2" />
                              {visitor.email}
                            </div>
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2" />
                              {visitor.phoneNumber}
                            </div>
                            {visitor.company && (
                              <div className="flex items-center">
                                <Users className="w-4 h-4 mr-2" />
                                {visitor.company}
                              </div>
                            )}
                            {(visitor.city || visitor.state || visitor.country) && (
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" />
                                {[visitor.city, visitor.state, visitor.country].filter(Boolean).join(', ')}
                              </div>
                            )}
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              Registered: {new Date(visitor.visitorRegistrationDate).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <Filter className="w-4 h-4 mr-2" />
                              Source: {visitor.source}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewVisitor(visitor)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQRCode(visitor)}
                            className="flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" />
                            QR Code
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t">
                    <div className="text-sm text-gray-700">
                      Page {pagination.current} of {pagination.total}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current - 1)}
                        disabled={pagination.current === 1}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.current + 1)}
                        disabled={pagination.current === pagination.total}
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* View Visitor Details Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Visitor Details</DialogTitle>
              <DialogDescription>
                Complete information for this visitor
              </DialogDescription>
            </DialogHeader>
            
            {selectedVisitor && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Full Name</label>
                      <p className="text-sm">{selectedVisitor.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{selectedVisitor.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone Number</label>
                      <p className="text-sm">{selectedVisitor.phoneNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVisitor.status)}`}>
                        {selectedVisitor.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Event Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Event Name</label>
                      <p className="text-sm">{selectedVisitor.eventName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Event Location</label>
                      <p className="text-sm">{selectedVisitor.eventLocation}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Event Start Date</label>
                      <p className="text-sm">{new Date(selectedVisitor.eventStartDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Event End Date</label>
                      <p className="text-sm">{new Date(selectedVisitor.eventEndDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedVisitor.company && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-sm">{selectedVisitor.company}</p>
                      </div>
                    )}
                    {selectedVisitor.city && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">City</label>
                        <p className="text-sm">{selectedVisitor.city}</p>
                      </div>
                    )}
                    {selectedVisitor.state && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">State</label>
                        <p className="text-sm">{selectedVisitor.state}</p>
                      </div>
                    )}
                    {selectedVisitor.country && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Country</label>
                        <p className="text-sm">{selectedVisitor.country}</p>
                      </div>
                    )}
                    {selectedVisitor.pincode && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pincode</label>
                        <p className="text-sm">{selectedVisitor.pincode}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Source</label>
                      <p className="text-sm">{selectedVisitor.source}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entry Type</label>
                      <p className="text-sm">{selectedVisitor.entryType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Registration Date</label>
                      <p className="text-sm">{new Date(selectedVisitor.visitorRegistrationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Fields */}
                {Object.keys(selectedVisitor).filter(key => 
                  !['_id', 'eventId', 'eventName', 'eventLocation', 'eventStartDate', 'eventEndDate', 'ownerId', 'fullName', 'email', 'phoneNumber', 'company', 'city', 'state', 'country', 'pincode', 'source', 'entryType', 'visitorRegistrationDate', 'status', 'createdAt', 'updatedAt'].includes(key)
                ).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Custom Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.keys(selectedVisitor).filter(key => 
                        !['_id', 'eventId', 'eventName', 'eventLocation', 'eventStartDate', 'eventEndDate', 'ownerId', 'fullName', 'email', 'phoneNumber', 'company', 'city', 'state', 'country', 'pincode', 'source', 'entryType', 'visitorRegistrationDate', 'status', 'createdAt', 'updatedAt'].includes(key)
                      ).map((key) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-500">{key}</label>
                          <p className="text-sm">{selectedVisitor[key]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* QR Code Modal */}
        <Dialog open={qrModalOpen} onOpenChange={(open) => {
          setQrModalOpen(open);
          if (!open) {
            setQrCodeUrl('');
            setSelectedVisitor(null);
            setGeneratingQR(false);
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Visitor QR Code</DialogTitle>
              <DialogDescription>
                QR code for visitor identification
              </DialogDescription>
            </DialogHeader>
            
            {selectedVisitor && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">{selectedVisitor.fullName}</h3>
                  <p className="text-sm text-gray-600">{getEventName(selectedVisitor.eventId)}</p>
                </div>
                
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    {qrCodeUrl ? (
                      <div className="w-72 h-72 flex items-center justify-center">
                        <Image
                          src={qrCodeUrl}
                          alt="Visitor QR Code"
                          width={300}
                          height={300}
                          className="rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-72 h-72 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          {generatingQR ? (
                            <>
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-2"></div>
                              <p className="text-sm text-gray-500">Generating QR Code...</p>
                            </>
                          ) : (
                            <>
                              <QrCode className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">QR Code Ready</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">Visitor ID: {selectedVisitor._id || ''}</p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setQrModalOpen(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button 
                    className="flex-1 flex items-center gap-2"
                    onClick={downloadQRCode}
                    disabled={!qrCodeUrl}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default VisitorManagement; 