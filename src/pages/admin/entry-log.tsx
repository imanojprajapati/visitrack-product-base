import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useDebounceSearch } from '@/hooks/use-debounced-search';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

import { 
  ClipboardList,
  Search,
  User,
  Calendar,
  MapPin,
  Building,
  Phone,
  Mail,
  QrCode,
  UserCheck,
  Filter,
  RefreshCw,
  Plus,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Edit,
  Printer
} from 'lucide-react';

interface Visitor {
  _id: string;
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
  eventEndDate: string;
  ownerId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  source?: string;
  entryType: string;
  visitorRegistrationDate: string;
  status: 'Registration' | 'Visited';
  createdAt: string;
  updatedAt: string;
}

const EntryLog = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 50;
  
  // Filter states
  const [entryTypeFilter, setEntryTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Manual entry states
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const [manualEntryId, setManualEntryId] = useState('');
  const [updatingEntry, setUpdatingEntry] = useState(false);

  // Debounced search
  const searchHook = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      // Client-side filtering since we fetch all data
      filterVisitors(searchTerm, entryTypeFilter, statusFilter);
    }, [entryTypeFilter, statusFilter])
  });

  // Client-side filtering function
  const filterVisitors = useCallback((searchTerm: string, entryType: string, status: string) => {
    let filtered = visitors.filter(visitor => {
      const matchesSearch = !searchTerm || 
        visitor.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        visitor.phoneNumber.includes(searchTerm) ||
        visitor.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (visitor.company && visitor.company.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesEntryType = entryType === 'all' || 
                              (entryType === 'manual' && visitor.entryType.toLowerCase() === 'manual') ||
                              (entryType === 'qr' && visitor.entryType.toLowerCase() === 'qr');
      
      const matchesStatus = status === 'all' || visitor.status === status;
      
      return matchesSearch && matchesEntryType && matchesStatus;
    });
    
    setFilteredVisitors(filtered);
  }, [visitors]);

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
      fetchEntryLog();
    }
  }, [isAuthenticated, user?.id, currentPage]);

  // Filter visitors when data changes or filters change
  useEffect(() => {
    filterVisitors(searchHook.debouncedSearchTerm, entryTypeFilter, statusFilter);
  }, [visitors, searchHook.debouncedSearchTerm, entryTypeFilter, statusFilter, filterVisitors]);

  const fetchEntryLog = async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/entry-log?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVisitors(data.visitors);
        setTotalPages(data.totalPages);
        setTotalCount(data.totalCount);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch entry log data",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching entry log:', error);
      toast({
        title: "Error",
        description: "Failed to fetch entry log data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualEntryId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a visitor ID",
        variant: "destructive"
      });
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) return;

    try {
      setUpdatingEntry(true);
      const response = await fetch('/api/entry-log/manual-entry', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorId: manualEntryId.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: `Entry type updated to Manual for ${data.visitorName}`,
        });
        setManualEntryId('');
        setShowManualEntryForm(false);
        fetchEntryLog(); // Refresh the data
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update entry type",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating entry type:', error);
      toast({
        title: "Error",
        description: "Failed to update entry type",
        variant: "destructive"
      });
    } finally {
      setUpdatingEntry(false);
    }
  };

  const getEntryTypeBadge = (entryType: string) => {
    const type = entryType.toLowerCase();
    if (type === 'manual') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Manual</Badge>;
    } else if (type === 'qr') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">QR Code</Badge>;
    } else {
      return <Badge variant="secondary">{entryType || 'Unknown'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'Visited') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Visited</Badge>;
    } else {
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">Registration</Badge>;
    }
  };

  const handlePrintBadge = async (visitor: Visitor) => {
    try {
      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(visitor._id, {
        width: 60,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Create PDF with custom dimensions (200x80px at 72 DPI)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [200, 80]
      });

      // Set up basic styling
      pdf.setFontSize(8);
      pdf.setTextColor(0, 0, 0);

      // Add QR code on the left side
      pdf.addImage(qrCodeDataUrl, 'PNG', 10, 10, 60, 60);

      // Add visitor details on the right side
      const rightSideX = 80;
      let currentY = 15;
      
      // Visitor Name (bold)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(visitor.fullName, rightSideX, currentY);
      currentY += 12;

      // Visitor ID
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.text(`ID: ${visitor._id}`, rightSideX, currentY);
      currentY += 10;

      // Event Name
      pdf.setFontSize(8);
      pdf.text(`Event: ${visitor.eventName}`, rightSideX, currentY);
      currentY += 10;

      // Company (if available)
      if (visitor.company) {
        pdf.text(`Company: ${visitor.company}`, rightSideX, currentY);
      }

      // Save the PDF
      pdf.save(`badge_${visitor.fullName.replace(/\s+/g, '_')}_${visitor._id}.pdf`);

      toast({
        title: "Success",
        description: "Badge downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating badge:', error);
      toast({
        title: "Error",
        description: "Failed to generate badge. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              Entry Log
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              Track visitor entries and manage manual check-ins
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowManualEntryForm(!showManualEntryForm)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Manual Entry
            </Button>
            <Button
              variant="outline"
              onClick={fetchEntryLog}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Manual Entry Form */}
        {showManualEntryForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Manual Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Enter Visitor ID (e.g., 685bcfea4da2251d0ea053e1)"
                    value={manualEntryId}
                    onChange={(e) => setManualEntryId(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleManualEntry}
                    disabled={updatingEntry || !manualEntryId.trim()}
                    className="flex items-center gap-2"
                  >
                    {updatingEntry ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Update to Manual
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowManualEntryForm(false);
                      setManualEntryId('');
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Enter a visitor ID to change their entry type to "Manual"
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, email, phone, event, or company..."
                  value={searchHook.searchTerm}
                  onChange={(e) => searchHook.updateSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
                {searchHook.isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={entryTypeFilter}
                    onChange={(e) => setEntryTypeFilter(e.target.value as 'all' | 'manual' | 'qr')}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Entry Types</option>
                    <option value="manual">Manual</option>
                    <option value="qr">QR Code</option>
                  </select>
                </div>
                
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Registration' | 'Visited')}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="Registration">Registration</option>
                    <option value="Visited">Visited</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredVisitors.length} of {totalCount} entries
            </div>
          </CardContent>
        </Card>

        {/* Entry Log Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Entry Log ({filteredVisitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredVisitors.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {visitors.length === 0 ? 'No entry log data found' : 'No entries match your search criteria'}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Cards */}
                <div className="block sm:hidden space-y-4">
                  {filteredVisitors.map((visitor) => (
                    <Card key={visitor._id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-gray-900">{visitor.fullName}</h3>
                              <p className="text-sm text-gray-600">{visitor.email}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {getEntryTypeBadge(visitor.entryType)}
                              {getStatusBadge(visitor.status)}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3" />
                              {visitor.eventName}
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3 h-3" />
                              {visitor.eventLocation}
                            </div>
                            {visitor.company && (
                              <div className="flex items-center gap-2">
                                <Building className="w-3 h-3" />
                                {visitor.company}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />
                              {visitor.phoneNumber}
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            ID: {visitor._id}
                          </div>
                          
                          <div className="pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintBadge(visitor)}
                              className="flex items-center gap-2 w-full text-sm"
                            >
                              <Printer className="w-3 h-3" />
                              Print Badge
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Visitor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Event</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Entry Type</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredVisitors.map((visitor) => (
                        <tr key={visitor._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{visitor.fullName}</div>
                              <div className="text-sm text-gray-500">{visitor._id}</div>
                              {visitor.company && (
                                <div className="text-sm text-gray-600">{visitor.company}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-900">{visitor.eventName}</div>
                              <div className="text-sm text-gray-600">{visitor.eventLocation}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {visitor.email}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {visitor.phoneNumber}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {getEntryTypeBadge(visitor.entryType)}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(visitor.status)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-sm text-gray-600">
                              {new Date(visitor.visitorRegistrationDate).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePrintBadge(visitor)}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Printer className="w-3 h-3" />
                              Print Badge
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EntryLog; 