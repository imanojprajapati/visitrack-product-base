import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { VisitorDataset } from '@/types/visitor';
import { useDebounceSearch } from '@/hooks/use-debounced-search';

import { 
  FileText, 
  Search, 
  Download, 
  Calendar,
  MapPin,
  Building,
  Mail,
  Phone,
  User,
  Globe,
  Hash,
  CheckCircle,
  Clock,
  Filter,
  Upload,
  FileSpreadsheet,
  Users
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
  company: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  source: string;
  entryType: string;
  visitorRegistrationDate: string;
  status: 'Registration' | 'Visited';
  createdAt: { $date: { $numberLong: string } };
  updatedAt: { $date: { $numberLong: string } };
  [key: string]: any; // For custom fields like "Which AI Tools used mostly used"
}

interface VisitorResponse {
  visitors: Visitor[];
  pagination: {
    current: number;
    total: number;
    count: number;
    limit: number;
  };
}

interface VisitorDatasetResponse {
  visitorDataset: VisitorDataset[];
  pagination: {
    current: number;
    total: number;
    count: number;
    limit: number;
  };
}

const Reports = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('visitor-log');

  // Center DB states
  const [centerDbData, setCenterDbData] = useState<VisitorDataset[]>([]);
  const [centerDbLoading, setCenterDbLoading] = useState(false);
  const [centerDbError, setCenterDbError] = useState('');
  const [centerDbCurrentPage, setCenterDbCurrentPage] = useState(1);
  const [centerDbTotalPages, setCenterDbTotalPages] = useState(1);
  const [centerDbTotalCount, setCenterDbTotalCount] = useState(0);

  // Debounced search for visitor log
  const visitorLogSearch = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      if (isAuthenticated && user?.id) {
        setCurrentPage(1);
        fetchVisitors(1, searchTerm, true);
      }
    }, [isAuthenticated, user?.id])
  });

  // Debounced search for center DB
  const centerDbSearch = useDebounceSearch({
    delay: 1500,
    onSearch: useCallback((searchTerm: string) => {
      if (isAuthenticated && user?.id && activeTab === 'center-db') {
        setCenterDbCurrentPage(1);
        fetchCenterDbData(1, searchTerm);
      }
    }, [isAuthenticated, user?.id, activeTab])
  });

  // Import states
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  
  // Enhanced import states
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any>(null);
  const [columnMappings, setColumnMappings] = useState<{ [key: string]: string }>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Working Filter States
  const [filters, setFilters] = useState({
    eventName: 'all',
    status: 'all',
    eventLocation: 'all',
    state: 'all',
    city: 'all',
    country: 'all',
    pincode: 'all',
    source: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter options (unique values from data)
  const [filterOptions, setFilterOptions] = useState({
    eventNames: [] as string[],
    eventLocations: [] as string[],
    states: [] as string[],
    cities: [] as string[],
    countries: [] as string[],
    pincodes: [] as string[],
    sources: [] as string[]
  });

  // Pagination settings
  const ITEMS_PER_PAGE = 50;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  const fetchVisitors = async (page: number = 1, search: string = '', useFilters: boolean = true) => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString()
      });

      if (search && search.trim()) {
        params.append('search', search.trim());
      }
      
      // Apply filters if useFilters is true
      if (useFilters) {
        if (filters.eventName && filters.eventName !== 'all') {
          params.append('eventName', filters.eventName);
        }
        if (filters.status && filters.status !== 'all') {
          params.append('status', filters.status);
        }
        if (filters.eventLocation && filters.eventLocation !== 'all') {
          params.append('eventLocation', filters.eventLocation);
        }
        if (filters.state && filters.state !== 'all') {
          params.append('state', filters.state);
        }
        if (filters.city && filters.city !== 'all') {
          params.append('city', filters.city);
        }
        if (filters.country && filters.country !== 'all') {
          params.append('country', filters.country);
        }
        if (filters.pincode && filters.pincode !== 'all') {
          params.append('pincode', filters.pincode);
        }
        if (filters.source && filters.source !== 'all') {
          params.append('source', filters.source);
        }
      } else {
        // Use selectedStatus for backward compatibility
        if (selectedStatus && selectedStatus !== 'all') {
          params.append('status', selectedStatus);
        }
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

      const data: VisitorResponse = await response.json();
      setVisitors(data.visitors);
      setCurrentPage(data.pagination.current);
      setTotalPages(data.pagination.total);
      setTotalCount(data.pagination.count);
      
      // Update filter options with unique values from all data
      updateFilterOptions(data.visitors);
      
      console.log(`📊 [Reports] Fetched ${data.visitors.length} visitors (page ${data.pagination.current}/${data.pagination.total})`);
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setError('Failed to load visitor data');
    } finally {
      setLoading(false);
    }
  };

  // Update filter options with unique values
  const updateFilterOptions = (visitorData: Visitor[]) => {
    const eventNames = Array.from(new Set(visitorData.map(v => v.eventName).filter(Boolean)));
    const eventLocations = Array.from(new Set(visitorData.map(v => v.eventLocation).filter(Boolean)));
    const states = Array.from(new Set(visitorData.map(v => v.state).filter(Boolean)));
    const cities = Array.from(new Set(visitorData.map(v => v.city).filter(Boolean)));
    const countries = Array.from(new Set(visitorData.map(v => v.country).filter(Boolean)));
    const pincodes = Array.from(new Set(visitorData.map(v => v.pincode).filter(Boolean)));
    const sources = Array.from(new Set(visitorData.map(v => v.source).filter(Boolean)));

    setFilterOptions({
      eventNames: eventNames.sort(),
      eventLocations: eventLocations.sort(),
      states: states.sort(),
      cities: cities.sort(),
      countries: countries.sort(),
      pincodes: pincodes.sort(),
      sources: sources.sort()
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
    setCurrentPage(1);
    // Trigger immediate fetch with new filters
    setTimeout(() => {
      fetchVisitors(1, visitorLogSearch.debouncedSearchTerm, true);
    }, 100);
  };

  const fetchCenterDbData = async (page: number = 1, search: string = '') => {
    if (!user?.id) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/login');
      return;
    }

    try {
      setCenterDbLoading(true);
      setCenterDbError('');

      const params = new URLSearchParams({
        all: 'true',
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...(search && { search })
      });

      const response = await fetch(`/api/visitor-dataset?${params}`, {
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
        throw new Error('Failed to fetch visitor dataset');
      }

      const data: VisitorDatasetResponse = await response.json();
      setCenterDbData(data.visitorDataset);
      setCenterDbCurrentPage(data.pagination.current);
      setCenterDbTotalPages(data.pagination.total);
      setCenterDbTotalCount(data.pagination.count);
      
      console.log(`📊 [Center DB] Fetched ${data.visitorDataset.length} records (page ${data.pagination.current}/${data.pagination.total})`);
    } catch (error) {
      console.error('Error fetching visitor dataset:', error);
      setCenterDbError('Failed to load visitor dataset');
    } finally {
      setCenterDbLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchVisitors(1, visitorLogSearch.debouncedSearchTerm, true);
    }
  }, [isAuthenticated, user?.id]);

  // Fetch visitors when filters change (reset to page 1)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      setCurrentPage(1);
      fetchVisitors(1, visitorLogSearch.debouncedSearchTerm, true);
    }
  }, [filters]);

  // Fetch visitors when page changes (keep current search and filters)
  useEffect(() => {
    if (isAuthenticated && user?.id && currentPage > 1) {
      fetchVisitors(currentPage, visitorLogSearch.debouncedSearchTerm, true);
    }
  }, [currentPage]);

  useEffect(() => {
    if (isAuthenticated && user?.id && activeTab === 'center-db') {
      fetchCenterDbData(1, centerDbSearch.debouncedSearchTerm); // Always start from page 1 when component mounts or tab changes
    }
  }, [isAuthenticated, user?.id, activeTab]);

  // Fetch center DB data when page changes (keep current search)
  useEffect(() => {
    if (isAuthenticated && user?.id && activeTab === 'center-db' && centerDbCurrentPage > 1) {
      fetchCenterDbData(centerDbCurrentPage, centerDbSearch.debouncedSearchTerm);
    }
  }, [centerDbCurrentPage]);

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleCenterDbPageChange = (newPage: number) => {
    setCenterDbCurrentPage(newPage);
  };

  // Get visitors for display (no client-side pagination needed)
  const getPaginatedVisitors = () => {
    return visitors; // Already paginated by server
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (mongoDate: { $date: { $numberLong: string } }) => {
    if (!mongoDate?.$date?.$numberLong) return '-';
    try {
      const timestamp = parseInt(mongoDate.$date.$numberLong);
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  const exportToCSV = () => {
    if (visitors.length === 0) return;

    const headers = [
      'Name', 'Email', 'Phone No', 'Company', 'City', 'State', 'Country', 
      'Pincode', 'Event Name', 'Event Start Date', 'Event End Date', 
      'Event Location', 'Status', 'Source', 'Registration Date'
    ];

    const csvData = visitors.map(visitor => [
      visitor.fullName || '-',
      visitor.email || '-',
      visitor.phoneNumber || '-',
      visitor.company || '-',
      visitor.city || '-',
      visitor.state || '-',
      visitor.country || '-',
      visitor.pincode || '-',
      visitor.eventName || '-',
      formatDate(visitor.eventStartDate),
      formatDate(visitor.eventEndDate),
      visitor.eventLocation || '-',
      visitor.status || '-',
      visitor.source || '-',
      formatDate(visitor.visitorRegistrationDate)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with active filters info
    const activeFilters = Object.entries(filters)
      .filter(([key, value]) => value !== 'all')
      .map(([key, value]) => `${key}-${value}`)
      .join('_');
    
    const filename = `visitor-report-${new Date().toISOString().split('T')[0]}${activeFilters ? `_filtered-${activeFilters}` : ''}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCenterDbToCSV = () => {
    if (centerDbData.length === 0) return;

    const headers = [
      'Name', 'Email', 'Phone No', 'Company', 'City', 'State', 'Country', 
      'Pincode', 'Created Date', 'Updated Date'
    ];

    const csvData = centerDbData.map(data => [
      data.fullName || '-',
      data.email || '-',
      data.phoneNumber || '-',
      data.company || '-',
      data.city || '-',
      data.state || '-',
      data.country || '-',
      data.pincode || '-',
      data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '-',
      data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '-'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    const filename = `visitor-dataset-${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) || 
                       ['csv', 'xls', 'xlsx'].includes(fileExtension || '');
    
    if (!isValidType) {
      setImportError('Please upload a valid CSV or Excel file');
      return;
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      setImportError('File size must be less than 100MB');
      return;
    }

    setSelectedFile(file);
    setShowImportDialog(true);
    await handleFilePreview(file);
    
    // Clear the file input
    event.target.value = '';
  };

  const handleFilePreview = async (file: File) => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/login');
      return;
    }

    try {
      setImporting(true);
      setImportError('');
      setImportSuccess('');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/visitor-dataset/import-preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportPreviewData(result);
        setColumnMappings(result.suggestedMappings || {});
      } else {
        setImportError(result.message || 'Failed to preview file');
        setShowImportDialog(false);
      }
    } catch (error) {
      console.error('Preview error:', error);
      setImportError('Failed to preview file. Please try again.');
      setShowImportDialog(false);
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!selectedFile || !importPreviewData) return;

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      router.push('/login');
      return;
    }

    try {
      setImporting(true);
      setImportError('');
      setImportSuccess('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('columnMappings', JSON.stringify(columnMappings));

      const response = await fetch('/api/visitor-dataset/import-confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setImportSuccess(result.message);
        setShowImportDialog(false);
        setImportPreviewData(null);
        setColumnMappings({});
        setSelectedFile(null);
        
        // Refresh the center DB data
        await fetchCenterDbData(1, centerDbSearch.debouncedSearchTerm);
        
        // Clear success message after 5 seconds
        setTimeout(() => setImportSuccess(''), 5000);
      } else {
        setImportError(result.message || 'Failed to import data');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportError('Failed to import data. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const handleColumnMappingChange = (fileColumn: string, dbField: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [fileColumn]: dbField
    }));
  };

  const handleCancelImport = () => {
    setShowImportDialog(false);
    setImportPreviewData(null);
    setColumnMappings({});
    setSelectedFile(null);
    setImportError('');
    setImportSuccess('');
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

  const clearAllFilters = () => {
    setFilters({
      eventName: 'all',
      status: 'all',
      eventLocation: 'all',
      state: 'all',
      city: 'all',
      country: 'all',
      pincode: 'all',
      source: 'all'
    });
    setSelectedStatus('all');
    visitorLogSearch.clearSearch();
    setCurrentPage(1);
    fetchVisitors(1, '', true);
  };

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive visitor and system reports
            </p>
          </div>
        </div>

        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('visitor-log')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === 'visitor-log'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              Visitor Log
            </button>
            <button
              onClick={() => setActiveTab('center-db')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                activeTab === 'center-db'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Globe className="w-4 h-4" />
              Center DB
            </button>
          </div>

          {activeTab === 'visitor-log' && (
            <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Visitors</p>
                      <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Registered</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {visitors.filter(v => v.status === 'Registration').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Visited</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {visitors.filter(v => v.status === 'Visited').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Download className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Export</p>
                      <Button 
                        onClick={exportToCSV}
                        size="sm" 
                        className="mt-1"
                        disabled={visitors.length === 0}
                      >
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Cascading Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search by name, email, phone, or company..."
                        value={visitorLogSearch.searchTerm}
                        onChange={(e) => visitorLogSearch.updateSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                      {visitorLogSearch.isSearching && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="Registration">Registration</SelectItem>
                          <SelectItem value="Visited">Visited</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                        {Object.values(filters).some(v => v !== 'all') && (
                          <span className="bg-blue-600 text-white rounded-full px-2 py-1 text-xs">
                            {Object.values(filters).filter(v => v !== 'all').length}
                          </span>
                        )}
                      </Button>
                      
                      {Object.values(filters).some(v => v !== 'all') && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearAllFilters}
                          className="text-red-600 hover:text-red-700"
                        >
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Working Filter Options */}
                  {showFilters && (
                    <div className="border-t pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {/* Event Name Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Event Name</Label>
                          <Select value={filters.eventName} onValueChange={(value) => handleFilterChange('eventName', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Events" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Events</SelectItem>
                              {filterOptions.eventNames.map((eventName) => (
                                <SelectItem key={eventName} value={eventName}>
                                  {eventName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Status</Label>
                          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Status</SelectItem>
                              <SelectItem value="Registration">Registration</SelectItem>
                              <SelectItem value="Visited">Visited</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Event Location Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Event Location</Label>
                          <Select value={filters.eventLocation} onValueChange={(value) => handleFilterChange('eventLocation', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Locations</SelectItem>
                              {filterOptions.eventLocations.map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* State Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">State</Label>
                          <Select value={filters.state} onValueChange={(value) => handleFilterChange('state', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All States" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All States</SelectItem>
                              {filterOptions.states.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">City</Label>
                          <Select value={filters.city} onValueChange={(value) => handleFilterChange('city', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Cities" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Cities</SelectItem>
                              {filterOptions.cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Country Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Country</Label>
                          <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Countries" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Countries</SelectItem>
                              {filterOptions.countries.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Pincode Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Pincode</Label>
                          <Select value={filters.pincode} onValueChange={(value) => handleFilterChange('pincode', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Pincodes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Pincodes</SelectItem>
                              {filterOptions.pincodes.map((pincode) => (
                                <SelectItem key={pincode} value={pincode}>
                                  {pincode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Source Filter */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1">Source</Label>
                          <Select value={filters.source} onValueChange={(value) => handleFilterChange('source', value)}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Sources</SelectItem>
                              {filterOptions.sources.map((source) => (
                                <SelectItem key={source} value={source}>
                                  {source}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Active Filters Summary */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-sm text-gray-600">Active Filters:</span>
                          {Object.entries(filters).map(([key, value]) => 
                            value !== 'all' && (
                              <span key={key} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}: {value}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange(key, 'all')}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          )}
                          {Object.values(filters).every(v => v === 'all') && (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Visitor Log Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Visitor Log ({totalCount} total)</span>
                  <span className="text-sm font-normal text-gray-500">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} visitors
                    {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-600">
                    {error}
                  </div>
                ) : visitors.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No visitors found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-auto">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-semibold text-gray-900">Name</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Email</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Phone No</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Company</th>
                          <th className="text-left p-3 font-semibold text-gray-900">City</th>
                          <th className="text-left p-3 font-semibold text-gray-900">State</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Country</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Pincode</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Event Name</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Event Start</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Event End</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Event Location</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Status</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Source</th>
                          <th className="text-left p-3 font-semibold text-gray-900">Registration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getPaginatedVisitors().map((visitor, index) => (
                          <tr key={visitor._id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{visitor.fullName || '-'}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{visitor.email || '-'}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{visitor.phoneNumber || '-'}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{visitor.company || '-'}</span>
                              </div>
                            </td>
                            <td className="p-3 text-sm">{visitor.city || '-'}</td>
                            <td className="p-3 text-sm">{visitor.state || '-'}</td>
                            <td className="p-3 text-sm">{visitor.country || '-'}</td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Hash className="w-3 h-3 text-gray-400" />
                                {visitor.pincode || '-'}
                              </div>
                            </td>
                            <td className="p-3 text-sm font-medium">{visitor.eventName || '-'}</td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(visitor.eventStartDate)}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {formatDate(visitor.eventEndDate)}
                              </div>
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                {visitor.eventLocation || '-'}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge 
                                variant={visitor.status === 'Visited' ? 'default' : 'secondary'}
                                className={
                                  visitor.status === 'Visited' 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                    : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                }
                              >
                                {visitor.status || 'Registration'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm">{visitor.source || '-'}</td>
                            <td className="p-3 text-sm">{formatDate(visitor.visitorRegistrationDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-6 gap-2">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    
                    <span className="px-4 py-2 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            </div>
          )}

          {activeTab === 'center-db' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Globe className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Records</p>
                        <p className="text-2xl font-bold text-gray-900">{centerDbTotalCount}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                        <p className="text-2xl font-bold text-gray-900">{centerDbData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Download className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Export</p>
                        <Button 
                          onClick={exportCenterDbToCSV}
                          size="sm" 
                          className="mt-1"
                          disabled={centerDbData.length === 0}
                        >
                          CSV
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Upload className="w-6 h-6 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Import Data</p>
                        <div className="mt-1">
                          <input
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileImport}
                            className="hidden"
                            id="enhanced-file-import"
                            disabled={importing}
                          />
                          <Button 
                            size="sm"
                            disabled={importing}
                            onClick={() => setShowImportDialog(true)}
                          >
                            {importing ? 'Processing...' : 'Import'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Import Status Messages */}
              {(importError || importSuccess) && (
                <Card>
                  <CardContent className="p-4">
                    {importError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <div className="p-1 bg-red-100 rounded-full mr-3">
                            <FileText className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-red-800">Import Error</h4>
                            <p className="text-sm text-red-600">{importError}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {importSuccess && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <div className="p-1 bg-green-100 rounded-full mr-3">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800">Import Successful</h4>
                            <p className="text-sm text-green-600">{importSuccess}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Search */}
              <Card>
                <CardContent className="p-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name, email, phone, company, city, state, or country..."
                      value={centerDbSearch.searchTerm}
                      onChange={(e) => centerDbSearch.updateSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                    {centerDbSearch.isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Center DB Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-6 h-6 text-blue-600" />
                      <span>Visitor Dataset ({centerDbTotalCount} total)</span>
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      Page {centerDbCurrentPage} of {centerDbTotalPages}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {centerDbLoading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : centerDbError ? (
                    <div className="text-center py-12 text-red-600">
                      {centerDbError}
                    </div>
                  ) : centerDbData.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      No visitor dataset found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3 font-semibold text-gray-900">Name</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Email</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Phone No</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Company</th>
                            <th className="text-left p-3 font-semibold text-gray-900">City</th>
                            <th className="text-left p-3 font-semibold text-gray-900">State</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Country</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Pincode</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Created Date</th>
                            <th className="text-left p-3 font-semibold text-gray-900">Updated Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {centerDbData.map((data, index) => (
                            <tr key={data._id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{data.fullName || '-'}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{data.email || '-'}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{data.phoneNumber || '-'}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Building className="w-4 h-4 text-gray-400" />
                                  <span className="text-sm">{data.company || '-'}</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm">{data.city || '-'}</td>
                              <td className="p-3 text-sm">{data.state || '-'}</td>
                              <td className="p-3 text-sm">{data.country || '-'}</td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Hash className="w-3 h-3 text-gray-400" />
                                  {data.pincode || '-'}
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '-'}
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination */}
                  {centerDbTotalPages > 1 && (
                    <div className="flex justify-center items-center mt-6 gap-2">
                      <Button
                        variant="outline"
                        disabled={centerDbCurrentPage === 1}
                        onClick={() => handleCenterDbPageChange(centerDbCurrentPage - 1)}
                      >
                        Previous
                      </Button>
                      
                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {centerDbCurrentPage} of {centerDbTotalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        disabled={centerDbCurrentPage === centerDbTotalPages}
                        onClick={() => handleCenterDbPageChange(centerDbCurrentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Enhanced Import with Column Mapping</DialogTitle>
            <DialogDescription>
              Smart import system with automatic column detection and flexible mapping options.
            </DialogDescription>
          </DialogHeader>

          {!importPreviewData && importing && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span>Processing file...</span>
            </div>
          )}

          {!importPreviewData && !importing && (
            <div className="space-y-6">
              {/* Import Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-blue-800 mb-3">How Enhanced Import Works</h3>
                    <div className="text-sm text-blue-700 space-y-2">
                      <p>• <strong>Smart Import:</strong> Upload file and map columns to database fields</p>
                      <p>• <strong>Supported formats:</strong> CSV, Excel (.xlsx, .xls)</p>
                      <p>• <strong>File size limit:</strong> 100MB maximum</p>
                      <p>• <strong>Column mapping:</strong> Preview and map any column to any database field</p>
                      <p>• <strong>Auto-detection:</strong> System suggests column mappings automatically</p>
                      <p>• <strong>Flexible requirements:</strong> At least one of Name, Email, or Phone Number</p>
                      <p>• <strong>Custom fields:</strong> Any unmapped columns are preserved as custom fields</p>
                      <p>• <strong>Data preview:</strong> See exactly what will be imported before confirming</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Upload your file</h3>
                    <p className="text-sm text-gray-600">Choose a CSV or Excel file to begin the import process</p>
                  </div>
                  <Button 
                    onClick={() => document.getElementById('enhanced-file-import')?.click()}
                    className="mx-auto"
                  >
                    Choose File
                  </Button>
                </div>
              </div>
            </div>
          )}

          {importPreviewData && (
            <div className="space-y-6">
              {/* File Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-800">File: {importPreviewData.fileName}</h4>
                    <p className="text-sm text-blue-600">
                      {importPreviewData.headers.length} columns detected, {importPreviewData.totalRows} preview rows
                    </p>
                  </div>
                </div>
              </div>

              {/* Column Mapping */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Column Mapping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {importPreviewData.headers.map((header: string) => (
                    <div key={header} className="border border-gray-200 rounded-lg p-4">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        File Column: <span className="font-semibold text-blue-600">{header}</span>
                      </Label>
                      <Select
                        value={columnMappings[header] || 'ignore'}
                        onValueChange={(value) => handleColumnMappingChange(header, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">Ignore this column</SelectItem>
                          {importPreviewData.availableFields.map((field: any) => (
                            <SelectItem key={field.key} value={field.key}>
                              {field.label} {field.required && '(Required)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Show sample data */}
                      <div className="mt-2">
                        <Label className="text-xs text-gray-500">Sample data:</Label>
                        <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                          {importPreviewData.previewData
                            .slice(0, 3)
                            .map((row: any, idx: number) => (
                              <div key={idx}>{row[header] || '(empty)'}</div>
                            ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          {importPreviewData.headers.map((header: string) => (
                            <th key={header} className="px-3 py-2 text-left font-medium text-gray-700 border-r">
                              <div className="space-y-1">
                                <div className="font-semibold">{header}</div>
                                <div className="text-xs text-gray-500">
                                  → {columnMappings[header] === 'ignore' ? 'Ignored' : 
                                       columnMappings[header] ? 
                                       importPreviewData.availableFields.find((f: any) => f.key === columnMappings[header])?.label : 
                                       'Not mapped'}
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewData.previewData.map((row: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}>
                            {importPreviewData.headers.map((header: string) => (
                              <td key={header} className="px-3 py-2 border-r text-gray-600">
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Import Status */}
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-red-100 rounded-full">
                      <FileText className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-red-800">Import Error</h4>
                      <p className="text-sm text-red-600">{importError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                <Button 
                  onClick={handleConfirmImport}
                  disabled={importing || Object.values(columnMappings).every(v => v === 'ignore')}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    'Confirm Import'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancelImport}
                  disabled={importing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>

              {/* Mapping Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Mapping Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Required fields mapped:</strong> {
                      Object.values(columnMappings).filter(field => 
                        ['fullName', 'email', 'phoneNumber'].includes(field)
                      ).length
                    } / 3
                  </div>
                  <div>
                    <strong>Total fields mapped:</strong> {
                      Object.values(columnMappings).filter(field => field !== 'ignore').length
                    } / {importPreviewData.headers.length}
                  </div>
                  <div>
                    <strong>Ignored columns:</strong> {
                      Object.values(columnMappings).filter(field => field === 'ignore').length
                    }
                  </div>
                </div>
                
                {Object.values(columnMappings).every(v => v === 'ignore') && (
                  <div className="mt-2 text-sm text-amber-600">
                    ⚠️ All columns are set to ignore. Please map at least one field to proceed.
                  </div>
                )}
                
                {!Object.values(columnMappings).some(field => 
                  ['fullName', 'email', 'phoneNumber'].includes(field)
                ) && Object.values(columnMappings).some(field => field !== 'ignore') && (
                  <div className="mt-2 text-sm text-amber-600">
                    ⚠️ At least one required field (Full Name, Email, or Phone Number) must be mapped.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Reports; 